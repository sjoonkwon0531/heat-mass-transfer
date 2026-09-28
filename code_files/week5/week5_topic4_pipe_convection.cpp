// Week 5 - Topic 4: Forced Convection in a Pipe - Nusselt Correlations & LMTD
// Laminar (const T_w): <Nu> = (49.371 + (1.615*beta^(1/3) - 0.7)^3)^(1/3),
//   beta = Pe*D/L, limits: 3.660 (const T_w), 4.364 (const q_w)
// Turbulent (Gnielinski): <Nu> = (xi/8)(Re-1000)Pr / (1+12.7*sqrt(xi/8)(Pr^(2/3)-1))
//   * (1+(D/L)^(2/3)),  xi = (1.82*log10(Re)-1.64)^(-2)
// Q = h*A*LMTD,  LMTD = (dT_in - dT_out)/ln(dT_in/dT_out)
// Compile: g++ -O2 -std=c++17 week5_topic4_pipe_convection.cpp -o topic4 && ./topic4

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double PI = 3.14159265358979323846;

double nuLamConstT(double beta) {
    return std::cbrt(49.371 + std::pow(1.615 * std::cbrt(beta) - 0.7, 3));
}

double nuLamConstQ(double beta) {
    return std::cbrt(83.326 + std::pow(1.953 * std::cbrt(beta) - 0.6, 3));
}

double nuGnielinski(double Re, double Pr, double DoL = 0.0) {
    double xi = std::pow(1.82 * std::log10(Re) - 1.64, -2.0);
    double core = (xi / 8.0) * (Re - 1000.0) * Pr /
                  (1.0 + 12.7 * std::sqrt(xi / 8.0) * (std::pow(Pr, 2.0 / 3.0) - 1.0));
    return core * (1.0 + std::pow(DoL, 2.0 / 3.0));
}

int main() {
    std::printf("Fully developed laminar limits (beta -> 0):\n");
    std::printf("  const wall T   : Nu -> %.3f   (lecture: 3.660)\n", nuLamConstT(1e-12));
    std::printf("  const wall flux: Nu -> %.3f   (lecture: 4.364)\n", nuLamConstQ(1e-12));

    std::printf("\nEntrance effect (mean Nu vs beta = Pe*D/L):\n");
    std::printf("  beta      Nu(const T)   Nu(const q)\n");
    for (double b : {0.1, 1.0, 10.0, 100.0, 1000.0})
        std::printf("  %7.1f  %10.3f  %11.3f\n", b, nuLamConstT(b), nuLamConstQ(b));

    // --- Worked example: hot-wall pipe heating water (laminar) ---
    double rho = 997.0, cp = 4180.0, k = 0.61, nuw = 0.658e-6, Pr = 4.34;
    double D = 0.02, L = 3.0, v = 0.05, Tw = 80.0, Tin = 20.0;

    double Re = v * D / nuw;
    double Pe = Re * Pr;
    double beta = Pe * D / L;
    double Nu = nuLamConstT(beta);
    double h = Nu * k / D;
    double mdot = rho * v * PI * D * D / 4.0;
    double A = PI * D * L;

    double Tout = Tw - (Tw - Tin) * std::exp(-h * A / (mdot * cp));
    double dTin = Tw - Tin, dTout = Tw - Tout;
    double LMTD = (dTin - dTout) / std::log(dTin / dTout);
    double Q1 = h * A * LMTD;
    double Q2 = mdot * cp * (Tout - Tin);

    std::printf("\nWorked example: water, D = 2 cm, L = 3 m, v = 0.05 m/s, Tw = 80 C\n");
    std::printf("  Re = %.0f (laminar), Pe = %.0f, beta = %.1f\n", Re, Pe, beta);
    std::printf("  Nu = %.2f, h = %.1f W/m2K, T_out = %.2f C\n", Nu, h, Tout);
    std::printf("  LMTD = %.2f K, Q = h*A*LMTD = %.1f W vs mdot*cp*dT = %.1f W\n",
                LMTD, Q1, Q2);
    assert(std::fabs(Q1 - Q2) / Q2 < 1e-9);

    std::printf("\nSame pipe, higher speeds (Gnielinski):\n  v [m/s]   Re        Nu        h [W/m2K]\n");
    for (double vv : {0.5, 1.0, 2.0}) {
        double Re2 = vv * D / nuw;
        double Nu2 = nuGnielinski(Re2, Pr, D / L);
        std::printf("  %6.1f  %9.0f  %8.1f  %9.0f\n", vv, Re2, Nu2, Nu2 * k / D);
    }
    std::printf("  -> laminar to turbulent: h jumps by an order of magnitude.\n");
    return 0;
}
