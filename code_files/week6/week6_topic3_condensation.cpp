// Week 6 - Topic 3: Nusselt Film Condensation on a Vertical Wall
// delta(x) = [4 k mu dT x / (g rhoL (rhoL-rhov) h'_fg)]^(1/4), h_x = k/delta,
// h_Nusselt = (4/3) h_x(Lc) = 0.943 [k^3 g h'_fg rhoL(rhoL-rhov)/(mu dT Lc)]^(1/4),
// h'_fg = h_fg + (3/8) c_pL dT. Cylinder: 0.725; n-tube bank: 0.725/n^(1/4).
// Compile: g++ -O2 -std=c++17 week6_topic3_condensation.cpp -o topic3 && ./topic3

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double G = 9.81;
static const double RHO_L = 957.9, RHO_V = 0.596;
static const double MU_L = 2.79e-4, CP_L = 4217.0, K_L = 0.68;
static const double H_FG = 2.257e6;

double hPrime(double dT) { return H_FG + 0.375 * CP_L * dT; }

double deltaOfX(double x, double dT) {
    return std::pow(4.0 * K_L * MU_L * dT * x
                    / (G * RHO_L * (RHO_L - RHO_V) * hPrime(dT)), 0.25);
}

double hLocal(double x, double dT) { return K_L / deltaOfX(x, dT); }

double hAvgVertical(double L, double dT) {
    return 0.943 * std::pow(K_L * K_L * K_L * G * hPrime(dT) * RHO_L * (RHO_L - RHO_V)
                            / (MU_L * dT * L), 0.25);
}

double hAvgCylinder(double D, double dT, int n = 1) {
    return 0.725 * std::pow(K_L * K_L * K_L * G * hPrime(dT) * RHO_L * (RHO_L - RHO_V)
                            / (n * MU_L * dT * D), 0.25);
}

int main() {
    double dT = 10.0, L = 0.5;
    std::printf("Steam at 1 atm on a vertical wall, dT = %.0f K, L = %.1f m\n", dT, L);
    std::printf("  x [m]    delta [um]   h_x [W/m^2K]\n");
    for (double x : {0.01, 0.05, 0.1, 0.25, 0.5})
        std::printf("  %5.2f   %9.1f   %10.0f\n", x, deltaOfX(x, dT) * 1e6, hLocal(x, dT));
    std::printf("  -> film thickens as x^(1/4); h_x falls as x^(-1/4).\n");

    double havg = hAvgVertical(L, dT);
    std::printf("\n  h_avg = %.0f W/m^2K,  4/3 rule: h_avg/h_x(L) = %.4f\n",
                havg, havg / hLocal(L, dT));
    double Re = 4.0 * havg * dT * L / hPrime(dT) / MU_L;
    std::printf("  film Reynolds Re_f = %.0f (%s)\n", Re,
                Re < 1800 ? "laminar, Nusselt model OK" : "TURBULENT: 0.045 Re^(1/5) Pr^(1/3)");

    std::printf("\nEffect of dT (L = 0.5 m):\n  dT [K]   h_avg      q [kW/m^2]\n");
    for (double d : {5.0, 10.0, 20.0, 40.0}) {
        double h = hAvgVertical(L, d);
        std::printf("  %5.0f   %8.0f   %9.1f\n", d, h, h * d / 1e3);
    }
    std::printf("  -> h ~ dT^(-1/4) but q = h dT ~ dT^(3/4).\n");

    std::printf("\nHorizontal tube banks (D = 25 mm):\n  n     h_avg [W/m^2K]\n");
    for (int n : {1, 2, 4, 9, 16})
        std::printf("  %3d   %10.0f\n", n, hAvgCylinder(0.025, dT, n));
    std::printf("  -> h ~ n^(-1/4): lower tubes drown in condensate from above.\n");

    assert(std::fabs(havg / hLocal(L, dT) - 4.0 / 3.0) < 1e-3);
    assert(std::fabs(hAvgCylinder(0.025, dT, 16) / hAvgCylinder(0.025, dT, 1)
                     - std::pow(16.0, -0.25)) < 1e-9);
    return 0;
}
