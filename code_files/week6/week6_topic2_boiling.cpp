// Week 6 - Topic 2: Boiling Heat Transfer - Rohsenow, CHF, Film Boiling
// Nucleate:  q = mu_L h_fg sqrt(g(rhoL-rhov)/sigma) [c_pL dT/(C_sf h_fg Pr^1.7)]^3
// CHF:       q_crit = 0.18 h_fg rho_v [g sigma (rhoL-rhov)/rho_v^2]^(1/4)
// Film:      h = 0.62 [k_v^3 g (rhoL-rhov)(h_fg + 0.4 c_pL dT)/(D0 nu_v dT)]^(1/4)
// Radiation: h = h_r + h_c (h_c/h)^(1/3), solved by fixed point.
// Compile: g++ -O2 -std=c++17 week6_topic2_boiling.cpp -o topic2 && ./topic2

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double G = 9.81;
// saturated water / vapor at 1 atm
static const double RHO_L = 957.9, RHO_V = 0.596;
static const double MU_L = 2.79e-4, CP_L = 4217.0, PR_L = 1.76;
static const double H_FG = 2.257e6, SIGMA = 0.0589;
static const double K_V = 0.025, NU_V = 2.0e-5;

double qRohsenow(double dT, double Csf = 0.013) {
    return MU_L * H_FG * std::sqrt(G * (RHO_L - RHO_V) / SIGMA)
         * std::pow(CP_L * dT / (Csf * H_FG * std::pow(PR_L, 1.7)), 3);
}

double qCritical() {
    return 0.18 * H_FG * RHO_V * std::pow(G * SIGMA * (RHO_L - RHO_V) / (RHO_V * RHO_V), 0.25);
}

double hFilm(double dT, double D0 = 0.01) {
    return 0.62 * std::pow(K_V * K_V * K_V * G * (RHO_L - RHO_V)
                           * (H_FG + 0.4 * CP_L * dT) / (D0 * NU_V * dT), 0.25);
}

double hWithRadiation(double hc, double hr) {
    double h = hc + hr;
    for (int i = 0; i < 200; ++i) {
        double hn = hr + hc * std::cbrt(hc / h);
        if (std::fabs(hn - h) < 1e-10) break;
        h = hn;
    }
    return h;
}

int main() {
    std::printf("Nucleate boiling (Rohsenow), water at 1 atm, dT = 10 K:\n");
    std::printf("  C_sf     q [kW/m^2]\n");
    for (double Csf : {0.013, 0.006}) {
        std::printf("  %5.3f   %10.1f\n", Csf, qRohsenow(10, Csf) / 1e3);
    }
    std::printf("  -> q ~ 1/C_sf^3: surface finish enters cubed.\n");

    std::printf("\n  dT [K]   q [kW/m^2]  (C_sf = 0.013)\n");
    for (double dT : {5.0, 10.0, 15.0, 20.0, 25.0})
        std::printf("  %5.0f   %10.1f\n", dT, qRohsenow(dT) / 1e3);

    double qc = qCritical();
    std::printf("\nCritical heat flux: q_crit = %.2f MW/m^2\n", qc / 1e6);
    double dTchf = std::cbrt(qc / qRohsenow(1.0));
    std::printf("  Rohsenow reaches CHF near dT ~ %.0f K (boiling-curve point C)\n", dTchf);

    std::printf("\nStable film boiling around a D0 = 10 mm tube:\n");
    std::printf("  dT [K]    h_film [W/m^2K]   q [kW/m^2]\n");
    for (double dT : {200.0, 500.0, 1000.0}) {
        double h = hFilm(dT);
        std::printf("  %5.0f   %12.1f   %10.1f\n", dT, h, h * dT / 1e3);
    }

    double hc = hFilm(500), hr = 40.0;
    double ht = hWithRadiation(hc, hr);
    std::printf("\nRadiation correction (dT = 500 K, h_r = 40): h_c = %.1f -> h = %.1f\n", hc, ht);
    assert(hc < ht && ht < hc + hr);

    std::printf("\nBoiling-curve landmarks: ONB ~ 5 K, CHF ~ 30 K at %.1f MW/m^2, "
                "Leidenfrost ~ 100-120 K.\n", qc / 1e6);
    return 0;
}
