// Brigde.cpp  (WinAPI pipe bridge for Stockfish UCI)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <iostream>
#include <string>
#include <vector>
#include <sstream>

static std::string trimCR(std::string s) {
    if (!s.empty() && s.back() == '\r') s.pop_back();
    return s;
}

static std::wstring getExecutableDir() {
    wchar_t buffer[MAX_PATH];
    GetModuleFileNameW(NULL, buffer, MAX_PATH);
    std::wstring path(buffer);
    return path.substr(0, path.find_last_of(L"\\/"));
}

class StockfishUCI {
public:
    bool start(const std::wstring& stockfishExePath) {
        SECURITY_ATTRIBUTES sa{};
        sa.nLength = sizeof(sa);
        sa.bInheritHandle = TRUE;

        HANDLE childStdoutRdTmp = NULL, childStdoutWr = NULL;
        HANDLE childStdinRd = NULL, childStdinWrTmp = NULL;

        // Pipe for child's STDOUT
        if (!CreatePipe(&childStdoutRdTmp, &childStdoutWr, &sa, 0)) return false;
        if (!SetHandleInformation(childStdoutRdTmp, HANDLE_FLAG_INHERIT, 0)) return false; // parent read end not inheritable

        // Pipe for child's STDIN
        if (!CreatePipe(&childStdinRd, &childStdinWrTmp, &sa, 0)) return false;
        if (!SetHandleInformation(childStdinWrTmp, HANDLE_FLAG_INHERIT, 0)) return false; // parent write end not inheritable

        STARTUPINFOW si{};
        si.cb = sizeof(si);
        si.dwFlags = STARTF_USESTDHANDLES;
        si.hStdInput  = childStdinRd;
        si.hStdOutput = childStdoutWr;
        si.hStdError  = childStdoutWr;

        PROCESS_INFORMATION pi{};
        std::wstring cmdLine = L"\"" + stockfishExePath + L"\"";

        // CreateProcessW requires a writable, null-terminated command line buffer (LPWSTR).
        std::vector<wchar_t> cmdBuf(cmdLine.begin(), cmdLine.end());
        cmdBuf.push_back(L'\0');

        BOOL ok = CreateProcessW(
            NULL,
            cmdBuf.data(),
            NULL, NULL,
            TRUE,               // inherit handles
            CREATE_NO_WINDOW,   // no console window
            NULL, NULL,
            &si, &pi
        );

        // Parent closes ends it doesn't use
        CloseHandle(childStdoutWr);
        CloseHandle(childStdinRd);

        if (!ok) {
            CloseHandle(childStdoutRdTmp);
            CloseHandle(childStdinWrTmp);
            return false;
        }

        pi_ = pi;
        hChildStdoutRd_ = childStdoutRdTmp;
        hChildStdinWr_  = childStdinWrTmp;

        // UCI handshake
        sendLine("uci");
        if (!waitForContains("uciok")) return false;

        sendLine("isready");
        if (!waitForContains("readyok")) return false;

        return true;
    }

    void stop() {
        if (hChildStdinWr_) {
            sendLine("quit");
        }
        if (pi_.hProcess) {
            WaitForSingleObject(pi_.hProcess, 500);
            CloseHandle(pi_.hThread);
            CloseHandle(pi_.hProcess);
            pi_ = {};
        }
        if (hChildStdoutRd_) { CloseHandle(hChildStdoutRd_); hChildStdoutRd_ = NULL; }
        if (hChildStdinWr_)  { CloseHandle(hChildStdinWr_);  hChildStdinWr_  = NULL; }
        buffer_.clear();
    }

    std::string bestMoveFromFEN(const std::string& fen, int movetimeMs) {
        // New game helps avoid weird state
        sendLine("ucinewgame");
        sendLine("isready");
        waitForContains("readyok");

        sendLine("position fen " + fen);
        sendLine("go movetime " + std::to_string(movetimeMs));

        // Read until "bestmove ..."
        while (true) {
            std::string line = readLine();
            if (line.empty()) continue;
            if (line.rfind("bestmove ", 0) == 0) {
                // Format: bestmove e2e4 [ponder ...]
                std::istringstream iss(line);
                std::string tag, move;
                iss >> tag >> move;
                return move.empty() ? "(none)" : move;
            }
        }
    }

private:
    PROCESS_INFORMATION pi_{};
    HANDLE hChildStdoutRd_ = NULL;
    HANDLE hChildStdinWr_  = NULL;

    std::string buffer_; // accumulated stdout bytes

    void sendLine(const std::string& s) {
        if (!hChildStdinWr_) return;
        std::string out = s + "\n";
        DWORD written = 0;
        WriteFile(hChildStdinWr_, out.data(), (DWORD)out.size(), &written, NULL);
        // no FlushFileBuffers needed generally
    }

    std::string readLine() {
        // Return one line from buffer, or read more from pipe
        while (true) {
            size_t pos = buffer_.find('\n');
            if (pos != std::string::npos) {
                std::string line = buffer_.substr(0, pos);
                buffer_.erase(0, pos + 1);
                return trimCR(line);
            }

            char tmp[4096];
            DWORD read = 0;
            BOOL ok = ReadFile(hChildStdoutRd_, tmp, sizeof(tmp), &read, NULL);
            if (!ok || read == 0) {
                // process ended or pipe broken
                return "";
            }
            buffer_.append(tmp, tmp + read);
        }
    }

    bool waitForContains(const std::string& token) {
        // Keep reading lines until one contains token
        for (int guard = 0; guard < 10000; ++guard) {
            std::string line = readLine();
            if (line.find(token) != std::string::npos) return true;
        }
        return false;
    }
};

int main() {
    std::wstring stockfishPath = getExecutableDir() + L"\\stockfish-windows-x86-64-avx2.exe";

    StockfishUCI engine;
    if (!engine.start(stockfishPath)) {
        std::cerr << "ERROR: failed to start Stockfish. Check path.\n";
        return 1;
    }

    // Simple line protocol:
    // "bestmove <ms> <FEN...>"
    // "quit"
    std::string line;
    while (std::getline(std::cin, line)) {
        line = trimCR(line);
        if (line == "quit") break;
        if (line.rfind("bestmove ", 0) == 0) {
            std::istringstream iss(line);
            std::string cmd;
            int ms = 200;
            iss >> cmd >> ms;

            std::string fen;
            std::getline(iss, fen);
            if (!fen.empty() && fen.front() == ' ') fen.erase(0, 1);

            if (fen.empty()) {
                std::cout << "bestmove (none)\n" << std::flush;
                continue;
            }

            std::string bm = engine.bestMoveFromFEN(fen, ms);
            std::cout << "bestmove " << bm << "\n" << std::flush;
        } else {
            // ignore unknown
            std::cout << "err unknown_command\n" << std::flush;
        }
    }

    engine.stop();
    return 0;
}