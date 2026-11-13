// Week 12 - Topic 3: Turbulent Mass Transfer - Reynolds, Prandtl, von Karman and Chilton-Colburn Analogies
// Lecture (Part 2):
//   * eddy diffusivity: N_Ay = -(D_AB + eps_D) dcA/dy;  laminar sublayer delta/D = 62 Re^(-7/8)
//   * Reynolds (Sc = 1): kc/v = Cf/2;  Prandtl: kc/v = (Cf/2)/[1 + 5 sqrt(Cf/2)(Sc - 1)]
//   * von Karman: Sh = (Cf/2) Re Sc / {1 + 5 sqrt(Cf/2)[Sc - 1 + ln((1 + 5Sc)/6)]}
//   * Chilton-Colburn: j_D = (kc/v) Sc^(2/3) = Cf/2  (0.6 < Sc < 2500);  smooth pipe Cf/2 = 0.023 Re^(-0.2)
// Build: g++ -O2 -std=c++17 week12_topic3_turbulent_analogies.cpp -o topic3
#include <cmath>
#include <cstdio>
#include <initializer_list>

double halfCf(double Re) { return 0.023 * std::pow(Re, -0.2); }
double shReynolds(double Re, double Sc) { return halfCf(Re) * Re * Sc; }
double shPrandtl(double Re, double Sc) { double c = halfCf(Re); return c * Re * Sc / (1 + 5 * std::sqrt(c) * (Sc - 1)); }
double shKarman(double Re, double Sc) {
    double c = halfCf(Re);
    return c * Re * Sc / (1 + 5 * std::sqrt(c) * (Sc - 1 + std::log((1 + 5 * Sc) / 6)));
}
double shColburn(double Re, double Sc) { return halfCf(Re) * Re * std::cbrt(Sc); }

int main() {
    for (double Re : {1e4, 1e5}) {
        std::printf("=== Smooth pipe, Re = %.0e, Cf/2 = %.5f ===\n", Re, halfCf(Re));
        std::printf("     Sc    Reynolds    Prandtl   von Karman   Colburn\n");
        for (double Sc : {0.7, 1.0, 2.0, 10.0, 100.0, 1000.0})
            std::printf("  %6.1f  %9.1f  %9.1f  %9.1f   %9.1f\n", Sc, shReynolds(Re, Sc), shPrandtl(Re, Sc),
                        shKarman(Re, Sc), shColburn(Re, Sc));
        std::printf("\n");
    }
    std::printf("  -> all four agree at Sc = 1. Reynolds overshoots at large Sc (it ignores the sublayer resistance);\n");
    std::printf("     Prandtl and von Karman level off (they allow no eddy transport inside the sublayer),\n");
    std::printf("     while Colburn keeps the Sc^(1/3) growth seen in liquid-phase data within 0.6 < Sc < 2500\n");

    std::printf("\n=== Laminar sublayer thickness, delta/D = 62 Re^(-7/8) ===\n");
    for (double Re : {1e4, 3e4, 1e5, 3e5}) {
        double d = 62 * std::pow(Re, -0.875);
        std::printf("  Re = %7.0e: delta/D = %.5f  -> in a 25 mm pipe: %.0f um\n", Re, d, d * 25e3);
    }

    std::printf("\n=== Case: wall dissolution in a water pipe (Sc = 1000, Re = 2e4, D = 1e-9 m^2/s, d = 25 mm) ===\n");
    double Re = 2e4, Sc = 1000.0, D = 1e-9, d = 0.025;
    const char* names[3] = {"Prandtl", "von Karman", "Colburn"};
    double sh[3] = {shPrandtl(Re, Sc), shKarman(Re, Sc), shColburn(Re, Sc)};
    for (int i = 0; i < 3; ++i) std::printf("  %-10s: Sh = %7.1f, kc = %.2f um/s\n", names[i], sh[i], sh[i] * D / d * 1e6);
    std::printf("  -> a factor of ~3 between models at Sc = 1000: for liquids, use a Sc^(1/3) correlation\n");
    return 0;
}
