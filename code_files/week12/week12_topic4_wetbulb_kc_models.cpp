// Week 12 - Topic 4: Heat-Mass Analogy (Lewis Number) and the Three Models of kc
// Lecture (Part 1-2):
//   * Sc = nu/D, Pr = nu/alpha, Le = alpha/D;  Chilton-Colburn j_H = j_D  ->  h/kc = rho cp Le^(2/3)
//   * wet bulb: h (T_inf - T_s) = lambda kc (rho_v,s - rho_v,inf)
//   * kc models: film ~ D, penetration ~ D^(1/2), boundary layer ~ D^(2/3)
// Build: g++ -O2 -std=c++17 week12_topic4_wetbulb_kc_models.cpp -o topic4
#include <cmath>
#include <cstdio>
#include <functional>
#include <initializer_list>

double psat(double T) { return 611.21 * std::exp((18.678 - T / 234.5) * (T / (257.14 + T))); }

double wetBulb(double T, double RH, double Le, double P = 101325.0) {
    double Tk = T + 273.15, rho = P * 0.02897 / (8.314 * Tk), cp = 1006.0;
    double rv = RH * psat(T) * 0.018015 / (8.314 * Tk);
    auto f = [&](double Ts) {
        double lam = 2.501e6 - 2370.0 * Ts, rvs = psat(Ts) * 0.018015 / (8.314 * (Ts + 273.15));
        return (T - Ts) * rho * cp * std::pow(Le, 2.0 / 3) - lam * (rvs - rv);
    };
    double lo = -20.0, hi = T;
    for (int i = 0; i < 100; ++i) {
        double mid = 0.5 * (lo + hi);
        if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
    }
    return 0.5 * (lo + hi);
}

int main() {
    double alpha = 2.2e-5, D = 2.6e-5, Le = alpha / D;
    std::printf("=== 1. Lewis number of water vapor in air ===\n");
    std::printf("  Le = alpha/D = %.3f;  Le^(2/3) = %.3f  -> h/(rho cp kc) close to 1\n", Le, std::pow(Le, 2.0 / 3));

    std::printf("\n=== 2. Wet-bulb temperature from the heat-mass analogy ===\n");
    std::printf("   T (C)  RH    T_wb (Le^(2/3))   T_wb (Le = 1)\n");
    double cases[5][2] = {{20, 0.5}, {25, 0.6}, {30, 0.5}, {35, 0.3}, {40, 0.2}};
    for (auto& c : cases)
        std::printf("   %4.0f  %.1f   %8.2f          %8.2f\n", c[0], c[1], wetBulb(c[0], c[1], Le), wetBulb(c[0], c[1], 1.0));
    std::printf("  -> the difference between the two columns is the Lewis-number effect (a few tenths of a kelvin)\n");

    std::printf("\n=== 3. Evaporative cooling potential (T - T_wb) ===\n");
    for (double RH : {0.2, 0.4, 0.6, 0.8, 1.0})
        std::printf("  30 C, RH = %.1f: depression = %5.2f K\n", RH, 30 - wetBulb(30, RH, Le));

    std::printf("\n=== 4. How kc scales with D in the three models ===\n");
    double D1 = 1e-9, D2 = 2e-9, delta = 50e-6, tc = 0.1, nu = 1e-6, v = 0.5, L = 0.05;
    std::function<double(double)> fns[3] = {
        [=](double d) { return d / delta; },
        [=](double d) { return 2 * std::sqrt(d / (M_PI * tc)); },
        [=](double d) { return 0.664 * d / L * std::sqrt(v * L / nu) * std::cbrt(nu / d); }};
    const char* names[3] = {"film", "penetration", "boundary layer"};
    for (int i = 0; i < 3; ++i) {
        double k1 = fns[i](D1), k2 = fns[i](D2);
        std::printf("  %-15s: kc(D) = %7.2f um/s, doubling D multiplies kc by %.3f (exponent %.3f)\n",
                    names[i], k1 * 1e6, k2 / k1, std::log(k2 / k1) / std::log(2.0));
    }
    std::printf("  -> plotting log kc against log D and reading the slope tells which picture fits the equipment\n");
    return 0;
}
