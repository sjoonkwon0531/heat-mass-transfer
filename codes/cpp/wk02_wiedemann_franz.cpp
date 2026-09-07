// Wk02 - Wiedemann-Franz law with real metal data (293 K)
// Build: g++ -O2 -std=c++17 wk02_wiedemann_franz.cpp -o wf && ./wf
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <string>
#include <vector>

struct Metal { std::string name; double sigma, kappa; };

int main() {
    const double T = 293.0, L0 = 2.44e-8;
    std::vector<Metal> metals = {
        {"Ag", 6.30e7, 429}, {"Cu", 5.96e7, 401}, {"Au", 4.52e7, 317},
        {"Al", 3.77e7, 237}, {"W",  1.79e7, 173}, {"Zn", 1.69e7, 116},
        {"Ni", 1.43e7,  91}, {"Fe", 1.00e7,  80}, {"Pt", 0.94e7,  72},
        {"Pb", 0.455e7, 35},
    };
    std::printf("%-6s %10s %8s %12s %7s\n",
                "Metal", "sigma", "kappa", "L=k/(sT)", "L/L0");
    for (const auto& m : metals) {
        double L = m.kappa / (m.sigma * T);
        std::printf("%-6s %10.2e %8.0f %12.3e %7.2f\n",
                    m.name.c_str(), m.sigma, m.kappa, L, L / L0);
    }
    std::puts("\nOne carrier (free electrons) -> charge & heat locked (L ~ L0).");
    return 0;
}
