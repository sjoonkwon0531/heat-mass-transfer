// Week 16 · Topic 3 — Final review: convective mass transfer, correlations, interphase transfer
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   flat plate: Sh_L = 0.664 Re^1/2 Sc^1/3 (Re_L < 2e5), 0.0365 Re^4/5 Sc^1/3 (turbulent)
//   sphere (Frossling, Week 13): Sh = 2 + 0.552 Re^1/2 Sc^1/3, 2 < Re < 800, 0.6 < Sc < 2.7
//   pipe (liquid, turbulent): Sh = 0.023 Re^0.8 Sc^1/3 (Week 12 example)
//   two films: 1/Ky = 1/ky + m/kx;  absorber: NTU_OG = ln[(1 - 1/A)(yb - m xa)/(ya - m xa) + 1/A]/(1 - 1/A)
#include <cmath>
#include <cstdio>
#include <initializer_list>

void flat_plate(double U, double L, double nu, double D, double& Re, double& Sc, double& Sh, double& kc, const char*& reg) {
    Re = U * L / nu; Sc = nu / D;
    if (Re < 2e5) { Sh = 0.664 * std::sqrt(Re) * std::pow(Sc, 1.0 / 3); reg = "laminar"; }
    else { Sh = 0.0365 * std::pow(Re, 0.8) * std::pow(Sc, 1.0 / 3); reg = "turbulent"; }
    kc = Sh * D / L;
}

int main() {
    std::printf("Topic 3 — convection, correlations and interphase transfer\n\n");
    std::printf("[1] Flat plates in air at 25 C (nu = 1.55e-5 m2/s)\n");
    struct C { double U, L, D; const char* name; } cs[3] = {{2.0, 0.3, 2.6e-5, "water vapour"}, {5.0, 0.3, 6.1e-6, "naphthalene"}, {15.0, 1.0, 6.1e-6, "naphthalene"}};
    double Re, Sc, Sh, kc; const char* reg;
    for (auto& c : cs) {
        flat_plate(c.U, c.L, 1.55e-5, c.D, Re, Sc, Sh, kc, reg);
        std::printf("   %-12s U = %4.1f m/s, L = %.1f m: Re = %.3e (%s), Sc = %.3f, Sh = %.1f, k_c = %.3e m/s\n", c.name, c.U, c.L, Re, reg, Sc, Sh, kc);
    }
    flat_plate(2.0, 0.3, 1.55e-5, 2.6e-5, Re, Sc, Sh, kc, reg);
    std::printf("   evaporation (first case, rho_v,s = 0.0230 kg/m3): %.3f kg/m2 h\n\n", kc * 0.0230 * 3600);
    Re = 1.0 * 0.01 / 1.55e-5; Sc = 1.55e-5 / 6.1e-6;
    bool ok = (2 < Re && Re < 800) && (0.6 < Sc && Sc < 2.7);
    Sh = 2 + 0.552 * std::sqrt(Re) * std::pow(Sc, 1.0 / 3); kc = Sh * 6.1e-6 / 0.01;
    double cs_ = 10.4 / (8.314 * 298.15), N = kc * cs_;
    std::printf("[2] Naphthalene sphere d = 1 cm in air at 1 m/s (p* = 10.4 Pa, rho = 1145 kg/m3, M = 0.128 kg/mol)\n");
    std::printf("   Re = %.1f, Sc = %.3f, inside Frossling range: %s\n", Re, Sc, ok ? "yes" : "no");
    std::printf("   Sh = %.2f, k_c = %.4e m/s, N = %.4e mol/m2 s, dR/dt = %.3e m/s (%.3f mm/day)\n", Sh, kc, N, N * 0.128 / 1145, N * 0.128 / 1145 * 86400e3);
    double Sh6 = 2 + 0.6 * std::sqrt(Re) * std::pow(Sc, 1.0 / 3);
    std::printf("   with coefficient 0.6 instead: Sh = %.2f (x%.3f)\n\n", Sh6, Sh6 / Sh);
    Re = 5e4; Sc = 500.0;
    double ShCC = 0.023 * std::pow(Re, 0.8) * std::pow(Sc, 1.0 / 3), ShR = 0.023 * std::pow(Re, -0.2) * Re * Sc;
    std::printf("[3] Liquid in a 2 cm pipe, Re = 5e4, Sc = 500\n");
    std::printf("   Chilton-Colburn Sh = %.1f, k_c = %.3e m/s; Reynolds analogy Sh = %.3e (ratio %.1f = Sc^(2/3) = %.1f)\n", ShCC, ShCC * 1.2e-9 / 0.02, ShR, ShR / ShCC, std::pow(Sc, 2.0 / 3));
    std::printf("   bubble column: k_c ratio 1.41 for D ratio 2 -> exponent %.3f\n\n", std::log(1.41) / std::log(2.0));
    double ky = 1e-3, kx = 5e-3, m = 30.0, y = 0.05, x = 0.001, Ky = 1 / (1 / ky + m / kx), Nf = Ky * (y - m * x);
    std::printf("[4] Two films: ky = %.0e, kx = %.0e, m = %.0f, y = %.3f, x = %.3f\n", ky, kx, m, y, x);
    std::printf("   Ky = %.4e, N = %.4e, yi = %.4f, xi = %.4e, gas-film share = %.1f%%\n\n", Ky, Nf, y - Nf / ky, x + Nf / kx, 100 * (1 / ky) / (1 / ky + m / kx));
    double yb = 0.02, ya = yb * (1 - 0.9), xa = 0.0, mm = 1.0, LVmin = (yb - ya) / (yb / mm - xa), A = 1.5 * LVmin / mm;
    double NTU = std::log((1 - 1 / A) * (yb - mm * xa) / (ya - mm * xa) + 1 / A) / (1 - 1 / A);
    std::printf("[5] Dilute absorber: yb = 0.02, 90%% recovery, m = 1, L/V = 1.5 x minimum, HTU = 0.6 m\n");
    std::printf("   (L/V)min = %.3f, A = %.3f, NTU_OG = %.3f, Z = %.3f m\n", LVmin, A, NTU, 0.6 * NTU);
    return 0;
}
