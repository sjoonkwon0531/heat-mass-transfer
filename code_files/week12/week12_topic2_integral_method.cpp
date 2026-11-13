// Week 12 - Topic 2: Integral (von Karman-Pohlhausen) Analysis of the Concentration Boundary Layer
// Lecture (Part 1):
//   * d/dx int_0^delta_c vx (cA_inf - cA) dy = kc (cAs - cA_inf)
//   * cubic ansatz: vx/v_inf = (3/2)(y/delta_M) - (1/2)(y/delta_M)^3, same shape for the concentration
//   * momentum integral: delta_M/x = 4.64/Re_x^(1/2); r = delta_c/delta_M ~ 0.976 Sc^(-1/3)
//     -> Sh_x ~ 0.331 Sc^(1/3) Re_x^(1/2)  (lecture slide quotes 0.36)
//   * turbulent (1/7 power law): Sh_x = 0.0292 Re_x^(4/5)
// Build: g++ -O2 -std=c++17 week12_topic2_integral_method.cpp -o topic2
#include <cmath>
#include <cstdio>
#include <functional>
#include <initializer_list>

double simpson(const std::function<double(double)>& f, double a, double b, int n = 2000) {
    double h = (b - a) / n, s = f(a) + f(b);
    for (int i = 1; i < n; ++i) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
}
double cubic(double p) { return 1.5 * p - 0.5 * p * p * p; }
double G(double r) { return simpson([r](double p) { return cubic(r * p) * (1 - cubic(p)); }, 0.0, 1.0); }

double solveR(double Sc, double c2) {
    auto f = [&](double r) { return r * G(r) * c2 / 2 - 1.5 / (r * Sc); };
    double lo = 1e-4, hi = 1.01;
    for (int i = 0; i < 80; ++i) {
        double mid = 0.5 * (lo + hi);
        if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
    }
    return 0.5 * (lo + hi);
}

int main() {
    std::printf("=== 1. Momentum integral with the cubic profile ===\n");
    double Hm = simpson([](double p) { return cubic(p) * (1 - cubic(p)); }, 0, 1);
    double c = std::sqrt(3 / Hm);
    std::printf("  momentum thickness / delta = %.5f (= 39/280 = %.5f)\n", Hm, 39.0 / 280);
    std::printf("  delta_M / x = %.3f / Re_x^(1/2)   (exact Blasius delta_99: 4.91)\n", c);

    std::printf("\n=== 2. Concentration integral: r = delta_c/delta_M and Sh_x coefficient ===\n");
    std::printf("     Sc       r       r Sc^(1/3)   Sh_x / (Re^(1/2) Sc^(1/3))\n");
    for (double Sc : {1.0, 2.0, 10.0, 100.0, 1000.0}) {
        double r = solveR(Sc, c * c), coef = 1.5 / (r * c) / std::cbrt(Sc);
        std::printf("  %7.1f   %.4f    %.4f       %.4f\n", Sc, r, r * std::cbrt(Sc), coef);
    }
    std::printf("  exact (Blasius-Pohlhausen): 0.332; lecture slide: 0.36\n");

    std::printf("\n=== 3. Laminar versus turbulent local Sherwood numbers (Sc = 1) ===\n");
    for (double Re : {1e4, 1e5, 5e5, 1e6, 1e7})
        std::printf("  Re_x = %8.0e: laminar 0.332 Re^(1/2) = %8.1f,  turbulent 0.0292 Re^(4/5) = %8.1f\n",
                    Re, 0.332 * std::sqrt(Re), 0.0292 * std::pow(Re, 0.8));
    std::printf("  -> at transition (Re_x ~ 5e5) the turbulent law gives about 4.5 times more transfer\n");

    std::printf("\n=== 4. Case: naphthalene sublimation from a plate (illustrative properties) ===\n");
    double nu = 1.55e-5, D = 6.1e-6, v = 2.0, L = 0.10, W = 0.05, psat = 10.6, T = 298.15, M = 0.1282;
    double Sc = nu / D, ReL = v * L / nu, ShL = 0.664 * std::cbrt(Sc) * std::sqrt(ReL), kc = ShL * D / L;
    double cs = psat / (8.314 * T), rate = kc * W * L * cs * M;
    std::printf("  Sc = %.2f, Re_L = %.0f, Sh_L = %.1f, kc = %.3f cm/s\n", Sc, ReL, ShL, kc * 100);
    std::printf("  surface concentration = %.2f mmol/m^3; sublimation rate = %.1f mg/h\n", cs * 1e3, rate * 3.6e9);
    std::printf("  surface recession = %.2f um/h (rho = 1145 kg/m^3): measurable by profilometry\n",
                rate / (1145 * W * L) * 3.6e9);
    return 0;
}
