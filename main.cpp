#include <iostream>
#include <vector>
#include <queue>
#include <iomanip>
#include <algorithm>
#include <sstream>
using namespace std;

struct Process {
    string name;
    int arrival;
    int burst;
    int remaining;
    int start;
    int finish;
    int turnaround;
    int waiting;
    int priority;
    Process(string n, int a, int b, int p = 0)
        : name(n), arrival(a), burst(b), remaining(b), start(-1), finish(0), turnaround(0), waiting(0), priority(p) {}
};

struct ArrivalCompare {
    bool operator()(const Process &a, const Process &b) const {
        return a.arrival < b.arrival;
    }
};

vector<Process> processes;
vector<pair<char, int> > algorithms; // {algorithm_id, quantum (if any)}
int last_time = 0;

void readInput() {
    cout << "Enter algorithms (comma separated, e.g. 1 for FCFS, 2-2 for RR with quantum 2): ";
    string algo_line;
    cin >> algo_line;

    cout << "Enter simulation end time: ";
    cin >> last_time;

    cout << "Enter number of processes: ";
    int n;
    cin >> n;

    processes.clear();
    algorithms.clear();

    // Parse algorithms
    stringstream ss(algo_line);
    string token;
    while (getline(ss, token, ',')) {
        if (token[0] == '2' && token.size() > 2 && token[1] == '-') // RR with quantum
            algorithms.push_back({'2', stoi(token.substr(2))});
        else
            algorithms.push_back({token[0], 0});
    }

    cout << "Enter each process as: ProcessID ArrivalTime BurstTime [Priority]\n";
    for (int i = 0; i < n; ++i) {
        string name;
        int at, bt, prio = 0;
        cout << "Process " << (i+1) << ": ";
        cin >> name >> at >> bt;
        bool needs_priority = false;
        for (auto &a : algorithms) {
            if (a.first == '5' || a.first == '3') needs_priority = true; // HRRN or Priority
        }
        if (needs_priority) cin >> prio;
        processes.push_back(Process(name, at, bt, prio));
    }
}

void printGanttData(const vector<string> &timeline) {
    cout << "GANTT:";
    string last = "";
    int start = 0;
    for (int i = 0; i < timeline.size(); ++i) {
        if (timeline[i] != last) {
            if (!last.empty() && last != " ") {
                cout << " " << last << "," << start << "," << i << ";";
            }
            last = timeline[i];
            start = i;
        }
    }
    if (!last.empty() && last != " ") {
        cout << " " << last << "," << start << "," << timeline.size() << ";";
    }
    cout << "\n";
}

void printOutput(const string &title, const vector<string> &timeline) {
    cout << "=== " << title << " ===\n";
    cout << "Gantt Chart:\n| ";
    for (size_t i = 0; i < timeline.size(); ++i) {
        cout << timeline[i] << " | ";
    }
    cout << "\n\n";
    cout << "Process\tAT\tBT\tCT\tTAT\tWT\n";
    for (size_t i = 0; i < processes.size(); ++i) {
        cout << processes[i].name << "\t" << processes[i].arrival << "\t" << processes[i].burst << "\t" << processes[i].finish
             << "\t" << processes[i].turnaround << "\t" << processes[i].waiting << "\n";
    }
    cout << "\n";
}

void resetProcesses() {
    for (size_t i = 0; i < processes.size(); ++i) {
        processes[i].remaining = processes[i].burst;
        processes[i].start = -1;
        processes[i].finish = 0;
        processes[i].turnaround = 0;
        processes[i].waiting = 0;
    }
}

void fcfs() {
    resetProcesses();
    vector<Process> q = processes;
    sort(q.begin(), q.end(), ArrivalCompare());
    int time = 0;
    vector<string> timeline;
    for (size_t i = 0; i < q.size(); ++i) {
        if (time < q[i].arrival) {
            while (time < q[i].arrival) {
                timeline.push_back(" ");
                time++;
            }
        }
        for (int j = 0; j < q[i].burst; ++j) {
            timeline.push_back(q[i].name);
        }
        q[i].start = time;
        time += q[i].burst;
        q[i].finish = time;
        q[i].turnaround = q[i].finish - q[i].arrival;
        q[i].waiting = q[i].turnaround - q[i].burst;
    }
    for (size_t i = 0; i < q.size(); ++i) {
        for (size_t j = 0; j < processes.size(); ++j) {
            if (processes[j].name == q[i].name) processes[j] = q[i];
        }
    }
    printGanttData(timeline);
    printOutput("FCFS", timeline);
}

void rr(int quantum) {
    resetProcesses();
    int time = 0;
    vector<string> timeline;
    queue<int> q;
    vector<bool> added(processes.size(), false);
    while (time < last_time || !q.empty()) {
        for (size_t i = 0; i < processes.size(); ++i) {
            if (!added[i] && processes[i].arrival <= time) {
                q.push(i);
                added[i] = true;
            }
        }
        if (q.empty()) {
            timeline.push_back(" ");
            time++;
            continue;
        }
        int idx = q.front();
        q.pop();
        int run_time = min(quantum, processes[idx].remaining);
        for (int i = 0; i < run_time; ++i) {
            timeline.push_back(processes[idx].name);
        }
        if (processes[idx].start == -1) processes[idx].start = time;
        time += run_time;
        processes[idx].remaining -= run_time;
        for (size_t i = 0; i < processes.size(); ++i) {
            if (!added[i] && processes[i].arrival <= time) {
                q.push(i);
                added[i] = true;
            }
        }
        if (processes[idx].remaining > 0) {
            q.push(idx);
        } else {
            processes[idx].finish = time;
            processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
            processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
        }
    }
    printGanttData(timeline);
    printOutput("Round Robin (q=" + to_string(quantum) + ")", timeline);
}

void spn() {
    resetProcesses();
    int time = 0;
    vector<string> timeline;
    vector<bool> done(processes.size(), false);
    int completed = 0;
    while (completed < (int)processes.size()) {
        int idx = -1, min_bt = 1e9;
        for (size_t i = 0; i < processes.size(); ++i) {
            if (!done[i] && processes[i].arrival <= time && processes[i].burst < min_bt) {
                min_bt = processes[i].burst;
                idx = i;
            }
        }
        if (idx == -1) {
            timeline.push_back(" ");
            time++;
            continue;
        }
        for (int i = 0; i < processes[idx].burst; ++i)
            timeline.push_back(processes[idx].name);
        processes[idx].start = time;
        time += processes[idx].burst;
        processes[idx].finish = time;
        processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
        processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
        done[idx] = true;
        completed++;
    }
    printGanttData(timeline);
    printOutput("SPN", timeline);
}

void srt() {
    resetProcesses();
    int time = 0, completed = 0;
    vector<string> timeline;
    vector<bool> done(processes.size(), false);
    while (completed < (int)processes.size()) {
        int idx = -1, min_rt = 1e9;
        for (size_t i = 0; i < processes.size(); ++i) {
            if (!done[i] && processes[i].arrival <= time && processes[i].remaining < min_rt && processes[i].remaining > 0) {
                min_rt = processes[i].remaining;
                idx = i;
            }
        }
        if (idx == -1) {
            timeline.push_back(" ");
            time++;
            continue;
        }
        if (processes[idx].start == -1) processes[idx].start = time;
        processes[idx].remaining--;
        timeline.push_back(processes[idx].name);
        time++;
        if (processes[idx].remaining == 0) {
            done[idx] = true;
            processes[idx].finish = time;
            processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
            processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
            completed++;
        }
    }
    printGanttData(timeline);
    printOutput("SRT", timeline);
}

void hrrn() {
    resetProcesses();
    int time = 0, completed = 0;
    vector<string> timeline;
    vector<bool> done(processes.size(), false);
    while (completed < (int)processes.size()) {
        int idx = -1;
        double max_ratio = -1;
        for (size_t i = 0; i < processes.size(); ++i) {
            if (!done[i] && processes[i].arrival <= time) {
                double response_ratio = 1.0 + (double)(time - processes[i].arrival) / processes[i].burst;
                if (response_ratio > max_ratio) {
                    max_ratio = response_ratio;
                    idx = i;
                }
            }
        }
        if (idx == -1) {
            timeline.push_back(" ");
            time++;
            continue;
        }
        for (int i = 0; i < processes[idx].burst; ++i) timeline.push_back(processes[idx].name);
        processes[idx].start = time;
        time += processes[idx].burst;
        processes[idx].finish = time;
        processes[idx].turnaround = processes[idx].finish - processes[idx].arrival;
        processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
        done[idx] = true;
        completed++;
    }
    printGanttData(timeline);
    printOutput("HRRN", timeline);
}

int main() {
    readInput();
    for (size_t i = 0; i < algorithms.size(); ++i) {
        char algo = algorithms[i].first;
        int quantum = algorithms[i].second;
        if (algo == '1') fcfs();
        else if (algo == '2') rr(quantum);
        else if (algo == '3') spn();
        else if (algo == '4') srt();
        else if (algo == '5') hrrn();
        // Extend further for FB, Aging
    }
    cout << "Simulation complete.\n";
    return 0;
}