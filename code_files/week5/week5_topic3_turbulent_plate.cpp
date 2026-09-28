// Week 5 - Topic 3: Laminar-Turbulent Transition on a Flat Plate
// Re_crit = 5e5;  <Nu_lam> = 0.664*Pr^(1/3)*Re^(1/2)
// <Nu_turb> = 0.037*Re^0.8*Pr / (1 + 2.443*Re^(-0.1)*(Pr^(2/3)-1))
// blend:    <Nu> = sqrt(<Nu_lam>^2 + <Nu_turb>^2)   (10 < Re < 1e7, 0.6 < Pr < 2000)
// Compile: g++ -O2 -std=c++17 week5_topic3_turbulent_plate.cpp -o topic3 && ./topic3

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double RE_CRIT = 5.0e5;

double nuLam(double Re, double Pr) {
    return 0.664 * std::cbrt(Pr) * std::sqrt(Re);
}

double nuTurb(double Re, double Pr) {
    return 0.037 * std::pow(Re, 0.8) * Pr /
           (1.0 + 2.443 * std::pow(Re, -0.1) * (std::pow(Pr, 2.0 / 3.0) - 1.0));
}

double nuCombined(double Re, double Pr) {
    double nl = nuLam(Re, Pr), nt = nuTurb(Re, Pr);
    return std::sqrt(nl * nl + nt * nt);
}

int main() {
    double Pr = 0.707;  // air
    std::printf("Flat plate, air (Pr = 0.707):\n");
    std::printf("  Re          Nu_lam     Nu_turb    combined   regime\n");
    for (double Re : {1e3, 1e4, 1e5, 5e5, 1e6, 5e6, 1e7}) {
        std::printf("  %9.1e  %9.1f  %9.1f  %9.1f   %s\n",
                    Re, nuLam(Re, Pr), nuTurb(Re, Pr), nuCombined(Re, Pr),
                    Re < RE_CRIT ? "laminar" : "turbulent");
    }
    std::printf("  -> the quadrature blend hands over smoothly near Re_crit.\n");

    // --- Worked example: wind over a roof panel ---
    double nu_air = 15.9e-6, k_air = 0.0263, L = 2.0;
    std::printf("\nWind over an L = %.0f m panel: mean h vs wind speed\n", L);
    std::printf("  U [m/s]   Re_L        x_crit [m]     <Nu>       h [W/m2K]\n");
    for (double U : {1.0, 2.0, 5.0, 10.0, 20.0}) {
        double ReL = U * L / nu_air;
        double xc = RE_CRIT * nu_air / U;
        double Nu = nuCombined(ReL, Pr);
        double h = Nu * k_air / L;
        if (xc < L) std::printf("  %6.1f  %10.3e  %10.2f  %9.1f  %9.2f\n", U, ReL, xc, Nu, h);
        else        std::printf("  %6.1f  %10.3e  all laminar  %9.1f  %9.2f\n", U, ReL, Nu, h);
    }
    std::printf("  -> past transition, h grows nearly like U^0.8.\n");

    assert(std::fabs(nuCombined(1e7, Pr) / nuTurb(1e7, Pr) - 1.0) < 0.02);
    assert(std::fabs(nuTurb(1e6, 1.0) - 0.037 * std::pow(1e6, 0.8)) < 1e-6);
    return 0;
}
