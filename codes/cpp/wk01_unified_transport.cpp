// Wk01 - One equation, three physics (CSV output + erfc check)
// Build: g++ -O2 -std=c++17 wk01_unified_transport.cpp -o unified && ./unified
// Output: unified_profiles.csv (x, v, T, C, and analytic columns)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

std::vector<double> solve_diffusion(double delta, double L, int N, double t_end) {
    std::vector<double> phi(N, 0.0);
    phi[0] = 1.0;
    double dx = L / (N - 1);
    double dt = 0.4 * dx * dx / delta;
    int nstep = (int)std::ceil(t_end / dt);
    dt = t_end / nstep;
    double c = delta * dt / (dx * dx);
    std::vector<double> nw(N);
    for (int n = 0; n < nstep; ++n) {
        nw = phi;
        for (int i = 1; i < N - 1; ++i)
            nw[i] = phi[i] + c * (phi[i + 1] - 2 * phi[i] + phi[i - 1]);
        nw[0] = 1.0; nw[N - 1] = 0.0;
        phi.swap(nw);
    }
    return phi;
}

int main() {
    const double L = 0.02, T_END = 20.0;
    const int N = 201;
    const double nu = 8.9e-7, alpha = 1.43e-7, D = 2.0e-9;  // water

    auto v = solve_diffusion(nu, L, N, T_END);
    auto T = solve_diffusion(alpha, L, N, T_END);
    auto Cc = solve_diffusion(D, L, N, T_END);

    FILE* f = std::fopen("unified_profiles.csv", "w");
    std::fprintf(f, "x_mm,v_fdm,T_fdm,C_fdm,v_ana,T_ana,C_ana\n");
    for (int i = 0; i < N; ++i) {
        double x = L * i / (N - 1);
        std::fprintf(f, "%.4f,%.5f,%.5f,%.5f,%.5f,%.5f,%.5f\n",
            x * 1000, v[i], T[i], Cc[i],
            std::erfc(x / (2 * std::sqrt(nu * T_END))),
            std::erfc(x / (2 * std::sqrt(alpha * T_END))),
            std::erfc(x / (2 * std::sqrt(D * T_END))));
    }
    std::fclose(f);
    std::printf("Water: Pr = %.1f, Sc = %.0f, Le = %.0f\n",
                nu / alpha, nu / D, alpha / D);
    std::puts("Wrote unified_profiles.csv");
    return 0;
}
