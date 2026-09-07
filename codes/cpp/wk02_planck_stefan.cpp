// Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check + CSV)
// Build: g++ -O2 -std=c++17 wk02_planck_stefan.cpp -o planck && ./planck
// Output: planck_spectra.csv (lam_um, B at each T)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

int main() {
    const double h = 6.626e-34, c = 2.998e8, kB = 1.381e-23;
    const double SB = 5.670e-8, PI = 3.14159265358979;
    const std::vector<double> Ts = {2000, 3000, 4000, 5000, 5778};
    const int N = 2000;

    auto planck = [&](double lam, double T) {
        double x = h * c / (lam * kB * T);
        return 2 * PI * h * c * c / std::pow(lam, 5) / std::expm1(x);
    };

    // log-spaced wavelength grid: 50 nm .. 50 um
    std::vector<double> lam(N);
    for (int i = 0; i < N; ++i)
        lam[i] = std::pow(10.0, -7.3 + 3.0 * i / (N - 1));

    FILE* f = std::fopen("planck_spectra.csv", "w");
    std::fprintf(f, "lam_um");
    for (double T : Ts) std::fprintf(f, ",T%g", T);
    std::fprintf(f, "\n");
    for (int i = 0; i < N; ++i) {
        std::fprintf(f, "%.5e", lam[i] * 1e6);
        for (double T : Ts) std::fprintf(f, ",%.5e", planck(lam[i], T));
        std::fprintf(f, "\n");
    }
    std::fclose(f);

    for (double T : Ts) {
        double P = 0.0;
        for (int i = 0; i + 1 < N; ++i)
            P += 0.5 * (planck(lam[i], T) + planck(lam[i + 1], T))
                     * (lam[i + 1] - lam[i]);
        std::printf("T=%5.0f K: num = %.3e, sigma*T^4 = %.3e, "
                    "ratio = %.4f, Wien = %.2f um\n",
                    T, P, SB * std::pow(T, 4), P / (SB * std::pow(T, 4)),
                    2.898e-3 / T * 1e6);
    }
    return 0;
}
