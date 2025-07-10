# PriSched: Priority Scheduling Visualizer
PriSched: Priority Scheduling Visualizer PriSched is auser-friendly web-based tool for visualizing and simulating the Priority Scheduling algorithm used in operating systems. It allows users to input process details, assign priorities, and instantly view the resulting Gantt chart and scheduling order.


## 🎯 Project Aim

To provide an interactive educational platform for students and developers to understand and analyze the behavior of CPU scheduling algorithms such as:
- **Priority Scheduling**
- **FCFS (First-Come, First-Served)**
- **SJF (Shortest Job First)**
- **Round Robin**

---

## 🧩 Features

- ✅ Input custom processes with arrival time, burst time, and priority.
- ✅ Choose one or more scheduling algorithms to simulate.
- ✅ Generate dynamic **Gantt Charts** to visualize process execution order.
- ✅ View detailed metrics for each process:
  - Completion Time (CT)
  - Turnaround Time (TAT)
  - Waiting Time (WT)
- ✅ Calculate and display total and average TAT and WT per algorithm.
- ✅ Elegant and responsive UI design.

---

## 🛠️ Technologies Used

| Layer            | Technology           |
|------------------|----------------------|
| Frontend         | HTML5, CSS3, JavaScript |
| Styling/Effects  | CSS Animations, Flexbox |
| Gantt Visualization | DOM-based rendering with JavaScript |
| Backend Simulation | C++ (optional console simulator - `main.cpp`) |

---

## 📁 Project Structure

PriSched/
├── index.html # Main web interface
├── style.css # CSS for layout and styling
├── script.js # JavaScript logic for simulation & Gantt chart
├── main.cpp # (Optional) Console-based simulation tool in C++
├── README.md # Documentation


---

## 🚀 How to Run the Web App

### 1. Clone the Repository

```bash
git clone https://github.com/anjeeta-rwt25/PriSched.git
cd PriSched

#### 2. Open in Browser
Simply open the index.html file in any modern browser like Chrome, Firefox, or Edge:

bash

start index.html  # On Windows
# OR
open index.html   # On macOS

---
3. Usage Instructions
Add or remove processes using the buttons.

Select one or more scheduling algorithms.

Enter necessary details like Time Quantum (for Round Robin).

Click Run Simulation.

View Gantt Charts and calculated results for each algorithm.

---

🖥️ How to Run the C++ Console Simulator
A CLI-based version of the simulator is available in main.cp

Compile and Run (using g++)
bash

g++ main.cpp -o PriSchedSim
./PriSchedSim

---

📜 License
This project is open-source under the MIT License.


