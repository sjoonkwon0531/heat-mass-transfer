// Week 4 - Topic 3: Semi-Infinite Solid - Similarity (erf) & the Integral Method
// Exact:    (T - T0)/(Ts - T0) = erfc(eta),  eta = x/(2*sqrt(alpha*t))
// Integral: (T - T0)/(Ts - T0) ~ (1 - x/delta)^2, delta = sqrt(12*alpha*t)
// Penetration depth: exact 2.8*sqrt(alpha*t) vs integral 2.6895*sqrt(alpha*t) (~4% off)
// Compile: g++ -O2 -std=c++17 week4_topic3_semi_infinite.cpp -o topic3 && ./topic3

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double PI = 3.14159265358979323846;

double thetaExact(double eta) { return std::erfc(eta); }

double thetaIntegral(double eta) {
    double v = 1.0 - eta / std::sqrt(3.0);   // x/delta = eta/sqrt(3)
    return v > 0.0 ? v * v : 0.0;
}

double surfaceFlux(double k, double Ts, double T0, double alpha, double t) {
    return k * (Ts - T0) / std::sqrt(PI * alpha * t);
}

int main() {
    std::printf("Exact vs integral-method profile, Theta = (T-T0)/(Ts-T0):\n");
    std::printf("  eta      erfc(eta)   parabola   |diff|\n");
    double maxerr = 0.0;
    for (int i = 0; i <= 10; ++i) {
        double eta = 0.25 * i;
        double e = thetaExact(eta), a = thetaIntegral(eta);
        maxerr = std::fmax(maxerr, std::fabs(e - a));
        std::printf("  %4.2f    %8.5f   %8.5f   %7.5f\n", eta, e, a, std::fabs(e - a));
    }
    std::printf("  max pointwise gap ~ %.4f\n", maxerr);

    double xdInt = (1.0 - std::sqrt(0.05)) * std::sqrt(12.0);
    std::printf("\nPenetration depth / sqrt(alpha*t):\n");
    std::printf("  exact (erfc(1.4) = %.4f) : 2.8\n", std::erfc(1.4));
    std::printf("  integral method          : %.4f\n", xdInt);
    std::printf("  relative error           : %.1f %%\n", std::fabs(xdInt - 2.8) / 2.8 * 100.0);

    // Worked example
    double alpha = 7.0e-7, k = 1.2, Ts = 90.0, T0 = 15.0;
    std::printf("\nWorked example: alpha = 0.7 mm^2/s, Ts = 90, T0 = 15 degC\n");
    std::printf("  t [s]   depth [mm]   T at x=10mm   q_s [kW/m^2]\n");
    for (double t : {10.0, 60.0, 600.0, 3600.0}) {
        double depth = 2.8 * std::sqrt(alpha * t) * 1e3;
        double eta10 = 0.010 / (2.0 * std::sqrt(alpha * t));
        double T10 = T0 + (Ts - T0) * thetaExact(eta10);
        std::printf("  %6.0f  %9.1f   %10.2f   %10.3f\n",
                    t, depth, T10, surfaceFlux(k, Ts, T0, alpha, t) / 1e3);
    }
    std::printf("  -> depth grows as sqrt(t); surface flux decays as 1/sqrt(t).\n");

    assert(std::fabs(thetaExact(0.0) - 1.0) < 1e-12);
    assert(thetaExact(3.0) < 3e-5);
    assert(std::fabs(thetaIntegral(std::sqrt(3.0))) < 1e-12);
    return 0;
}
