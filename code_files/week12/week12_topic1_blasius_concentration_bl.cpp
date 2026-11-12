// Week 12 - Topic 1: Laminar Boundary Layers - Blasius Similarity and the Concentration Boundary Layer
// Lecture (Part 1):
//   * flat plate, steady laminar flow, similarity variable eta = y sqrt(v_inf/(nu x)), stream function
//     psi = sqrt(nu x v_inf) f(eta)  ->  vx/v_inf = f'(eta)
//   * Blasius equation (lecture form):  2 f''' + f f'' = 0,  f(0) = f'(0) = 0,  f'(inf) = 1
//     shooting gives f''(0) = 0.332057  ->  wall shear  dvx/dy|0 = 0.332 v_inf sqrt(v_inf/(nu x))
//   * concentration: C'' + (Sc/2) f C' = 0, C(0) = 0, C(inf) = 1  (Sc = 1 -> C = f')
//     C'(0) = 1 / int_0^inf exp(-(Sc/2) int_0^eta f ds) d eta
//   * local Sherwood number: Sh_x = C'(0) Re_x^(1/2)  ~  0.332 Sc^(1/3) Re_x^(1/2)
// Build: g++ -O2 -std=c++17 week12_topic1_blasius_concentration_bl.cpp -o topic1
#include <array>
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <vector>

const double ETA_MAX = 12.0, H = 0.001;
using V3 = std::array<double, 3>;

V3 rhs(const V3& u) { return {u[1], u[2], -0.5 * u[0] * u[2]}; }

std::vector<V3> blasius(double a) {
    V3 u = {0.0, 0.0, a};
    std::vector<V3> out{u};
    int n = int(ETA_MAX / H);
    for (int i = 0; i < n; ++i) {
        V3 k1 = rhs(u), t, k2, k3, k4;
        for (int j = 0; j < 3; ++j) t[j] = u[j] + 0.5 * H * k1[j];
        k2 = rhs(t);
        for (int j = 0; j < 3; ++j) t[j] = u[j] + 0.5 * H * k2[j];
        k3 = rhs(t);
        for (int j = 0; j < 3; ++j) t[j] = u[j] + H * k3[j];
        k4 = rhs(t);
        for (int j = 0; j < 3; ++j) u[j] += H / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
        out.push_back(u);
    }
    return out;
}

double shoot() {
    double lo = 0.2, hi = 0.5;
    for (int i = 0; i < 50; ++i) {
        double mid = 0.5 * (lo + hi);
        if (blasius(mid).back()[1] < 1.0) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}

double wallGradient(double Sc, const std::vector<V3>& u) {
    double F = 0.0, I = 0.0, gp = 1.0;
    for (size_t i = 1; i < u.size(); ++i) {
        F += 0.5 * (u[i][0] + u[i - 1][0]) * H;
        double g = std::exp(-0.5 * Sc * F);
        I += 0.5 * (g + gp) * H;
        gp = g;
    }
    return 1.0 / I;
}

int main() {
    std::printf("=== 1. Blasius: shooting for f''(0) ===\n");
    double a = shoot();
    std::vector<V3> u = blasius(a);
    std::printf("  f''(0) = %.6f   (lecture: 0.332057)\n", a);
    size_t i99 = 0;
    while (u[i99][1] < 0.99) ++i99;
    std::printf("  f'(eta) = 0.99 at eta = %.3f  ->  delta_99 = %.2f x / Re_x^(1/2)\n", i99 * H, i99 * H);
    std::printf("  far field: f(12) - 12 = %.4f  (displacement, lecture b = 1.7208)\n", u.back()[0] - 12);

    std::printf("\n=== 2. Concentration boundary layer: C'(0) versus Sc ===\n");
    std::printf("    Sc      C'(0)    0.332 Sc^(1/3)   ratio\n");
    for (double Sc : {0.6, 0.7, 1.0, 2.0, 10.0, 100.0, 1000.0}) {
        double g = wallGradient(Sc, u), ap = 0.332 * std::cbrt(Sc);
        std::printf("  %7.1f  %.5f   %.5f         %.4f\n", Sc, g, ap, g / ap);
    }
    std::printf("  -> Sh_x = C'(0) Re_x^(1/2); the Sc^(1/3) law is within 2%% for Sc >= 0.6\n");

    std::printf("\n=== 3. Example: local and mean Sherwood numbers on a 0.2 m plate ===\n");
    double nu = 1.5e-5, D = 6.0e-6, v = 3.0, L = 0.2, Sc = nu / D;
    for (double x : {0.05, 0.1, 0.2}) {
        double Re = v * x / nu, Sh = 0.332 * std::cbrt(Sc) * std::sqrt(Re);
        std::printf("  x = %4.2f m: Re_x = %8.0f, Sh_x = %6.1f, kc = %.3f cm/s\n", x, Re, Sh, Sh * D / x * 100);
    }
    double ReL = v * L / nu;
    std::printf("  mean over L: Sh_L = 0.664 Sc^(1/3) Re_L^(1/2) = %.1f  (= 2 x local value at x = L)\n",
                0.664 * std::cbrt(Sc) * std::sqrt(ReL));
    std::printf("  thickness ratio delta_M/delta_c ~ Sc^(1/3) = %.3f\n", std::cbrt(Sc));
    return 0;
}
