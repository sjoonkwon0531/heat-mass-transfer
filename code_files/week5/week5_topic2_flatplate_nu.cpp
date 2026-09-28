// Week 5 - Topic 2: Laminar Flat-Plate Heat Transfer - the Nusselt Number
// Local:   Nu_x = 0.332 * Pr^(1/3) * sqrt(Re_x)
// Mean :   Nu_L = 0.664 * Pr^(1/3) * sqrt(Re_L)  (= 2 * local at x = L)
// Integral method (cubic profile): Nu_x = 0.36 * Re_x^(1/2) * Pr^(1/3) (~8% high)
// Compile: g++ -O2 -std=c++17 week5_topic2_flatplate_nu.cpp -o topic2 && ./topic2

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

double nuLocal(double Rex, double Pr) {
    return 0.332 * std::cbrt(Pr) * std::sqrt(Rex);
}

double nuMean(double ReL, double Pr) {
    return 0.664 * std::cbrt(Pr) * std::sqrt(ReL);
}

int main() {
    // --- Worked example: air over a heated plate ---
    double nu_air = 15.9e-6, k_air = 0.0263, Pr_air = 0.707;
    double U = 5.0, L = 0.5, W = 0.5, Ts = 60.0, Tinf = 20.0;
    double ReL = U * L / nu_air;
    std::printf("Air, U = %.0f m/s, L = %.1f m: Re_L = %.3e < 5e5 -> laminar\n", U, L, ReL);

    std::printf("\nLocal values (h_x ~ x^(-1/2)):\n  x [m]    Re_x        Nu_x      h_x [W/m2K]\n");
    for (double x : {0.01, 0.05, 0.1, 0.2, 0.35, 0.5}) {
        double Rex = U * x / nu_air;
        double Nux = nuLocal(Rex, Pr_air);
        std::printf("  %5.2f  %10.3e  %8.2f  %10.2f\n", x, Rex, Nux, Nux * k_air / x);
    }

    double NuL = nuMean(ReL, Pr_air);
    double hbar = NuL * k_air / L;
    std::printf("\nMean: Nu_L = %.1f, h_bar = %.2f W/m2K\n", NuL, hbar);
    std::printf("Total heat rate (%.1fx%.1f m, dT = %.0f K): Q = %.1f W\n",
                W, L, Ts - Tinf, hbar * W * L * (Ts - Tinf));
    std::printf("Check: Nu_L / Nu_x(L) = %.3f (= 2 exactly)\n", NuL / nuLocal(ReL, Pr_air));

    std::printf("\nIntegral method vs exact prefactor: 0.36/0.332 = %.4f (~8%% high)\n",
                0.36 / 0.332);

    std::printf("\nPr sweep at Re_x = 1e5:\n  fluid           Pr      Nu_x\n");
    struct F { const char* n; double Pr; };
    for (F f : {F{"mercury", 0.016}, F{"air", 0.707}, F{"water(30C)", 5.4},
                F{"sea water", 13.0}, F{"light oil", 100.0}})
        std::printf("  %-12s %7.3f  %8.1f\n", f.n, f.Pr, nuLocal(1e5, f.Pr));
    std::printf("  cf) Pr^(1/3) scaling holds for Pr >~ 0.6; liquid metals differ.\n");

    assert(std::fabs(nuMean(1e5, 1.0) - 2 * nuLocal(1e5, 1.0)) < 1e-9);
    assert(std::fabs(nuLocal(1e5, 1.0) - 0.332 * std::sqrt(1e5)) < 1e-9);
    return 0;
}
