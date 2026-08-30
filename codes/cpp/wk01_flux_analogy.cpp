// Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
// Build: g++ -O2 -std=c++17 wk01_flux_analogy.cpp -o analogy && ./analogy
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <string>
#include <vector>

struct Mat { std::string name; double mu, k, D, rho, cp; };

int main() {
    std::vector<Mat> mats = {
        {"Air (25C)",   1.8e-5, 0.026, 2.5e-5, 1.18, 1005.0},
        {"Water (25C)", 8.9e-4, 0.61,  2.0e-9, 997.0, 4180.0},
        {"Glycerin",    0.95,   0.29,  1.0e-11, 1260.0, 2430.0},
        {"Engine oil",  0.80,   0.145, 1.0e-10, 888.0, 1880.0},
    };
    std::printf("%-14s %10s %10s %10s %8s %10s %8s\n",
                "Material", "nu", "alpha", "D", "Pr", "Sc", "Le");
    for (const auto& m : mats) {
        double nu = m.mu / m.rho;
        double alpha = m.k / (m.rho * m.cp);
        double Pr = nu / alpha, Sc = nu / m.D, Le = alpha / m.D;
        std::printf("%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\n",
                    m.name.c_str(), nu, alpha, m.D, Pr, Sc, Le);
    }
    std::puts("\nAll diffusivities share m^2/s -> ratios are dimensionless.");
    return 0;
}
