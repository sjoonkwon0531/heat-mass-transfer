// Week 4 - Topic 1: Lumped Capacitance & the Biot Number
// (T-Tinf)/(T0-Tinf) = exp(-t/tau) = exp(-Bi*Fo),  Bi = h*Lc/k,  Fo = alpha*t/Lc^2
// Also the steady heat-generating wire (lecture): Theta = (2 + Bi(1-eta^2))/(2 + Bi)
// Compile: g++ -O2 -std=c++17 week4_topic1_lumped_biot.cpp -o topic1 && ./topic1

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

double lumpedHistory(double Bi, double Fo) { return std::exp(-Bi * Fo); }

double wireProfile(double eta, double Bi) {
    return (2.0 + Bi * (1.0 - eta * eta)) / (2.0 + Bi);
}

int main() {
    // --- Case A: steel sphere quenched in oil ---
    double D = 0.010, rho = 7800.0, c = 480.0, k = 45.0, h = 400.0;
    double T0 = 850.0, Tinf = 60.0;
    double Lc = D / 6.0;                    // V/A of a sphere
    double Bi = h * Lc / k;
    double alpha = k / (rho * c);
    double tau = rho * c * Lc / h;

    std::printf("Case A: steel sphere, D = 10 mm, quenched in oil\n");
    std::printf("  Lc = D/6 = %.3f mm\n", Lc * 1e3);
    std::printf("  Bi = %.4f  (%s)\n", Bi, Bi < 0.1 ? "< 0.1 -> lumped OK" : ">= 0.1 -> full PDE");
    std::printf("  alpha = %.3f mm^2/s,  tau = %.2f s\n", alpha * 1e6, tau);

    std::printf("  t [s]   Fo      T [degC]\n");
    for (double t : {0.0, 5.0, 15.6, 30.0, 60.0, 120.0}) {
        double Fo = alpha * t / (Lc * Lc);
        double T = Tinf + (T0 - Tinf) * lumpedHistory(Bi, Fo);
        std::printf("  %5.1f  %6.2f  %8.2f\n", t, Fo, T);
    }
    std::printf("  time to 99%% equilibration: %.1f s\n", tau * std::log(100.0));

    { // sanity: exp(-Bi*Fo) == exp(-t/tau)
        double t = 37.0, Fo = alpha * t / (Lc * Lc);
        assert(std::fabs(lumpedHistory(Bi, Fo) - std::exp(-t / tau)) < 1e-12);
    }

    // --- Case B: physical meaning of Bi via the heat-generating wire ---
    std::printf("\nCase B: steady wire, Theta = (2 + Bi(1-eta^2))/(2 + Bi)\n");
    const double etas[5] = {0.0, 0.25, 0.5, 0.75, 1.0};
    std::printf("  eta:   ");
    for (double e : etas) std::printf(" %5.2f ", e);
    std::printf("\n");
    const double bis[5] = {0.0, 0.5, 2.0, 10.0, 1e12};
    for (double Biw : bis) {
        if (Biw > 1e6) std::printf("  Bi= inf:");
        else           std::printf("  Bi=%4.1f:", Biw);
        for (double e : etas) std::printf(" %5.3f ", wireProfile(e, Biw));
        std::printf("\n");
    }
    std::printf("  Bi->0: isothermal wire (convection-limited); "
                "Bi->inf: surface at Tinf (conduction-limited)\n");
    return 0;
}
