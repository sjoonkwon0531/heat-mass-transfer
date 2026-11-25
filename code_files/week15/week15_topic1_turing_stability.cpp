// Week 15 · Topic 1 — Linear stability and the Turing instability
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   2x2 system: lambda^2 - T lambda + Delta = 0
//   reaction-diffusion: W_t = D lap W + J W  ->  lambda(k) = eig(J - k^2 D)
//   Example: Lengyel-Epstein (CDIMA) model
//     u_t = a - u - 4uv/(1+u^2) + lap u
//     v_t = sigma [ b (u - uv/(1+u^2)) + d lap v ]
#include <cmath>
#include <cstdio>
#include <string>

struct Eig { double re1, im1, re2, im2; };

Eig eig2(double a11, double a12, double a21, double a22) {
    double T = a11 + a22, De = a11 * a22 - a12 * a21, disc = T * T - 4 * De;
    if (disc >= 0) { double r = std::sqrt(disc); return {(T + r) / 2, 0.0, (T - r) / 2, 0.0}; }
    double r = std::sqrt(-disc);
    return {T / 2, r / 2, T / 2, -r / 2};
}

std::string classify(double a11, double a12, double a21, double a22) {
    double T = a11 + a22, De = a11 * a22 - a12 * a21;
    if (De < 0) return "saddle";
    if (T * T - 4 * De < 0) {
        if (T < 0) return "stable spiral";
        return T > 0 ? "unstable spiral" : "center";
    }
    return T < 0 ? "stable node" : "unstable node";
}

double lam_max(double fu, double fv, double gu, double gv, double d, double k) {
    double k2 = k * k;
    return eig2(fu - k2, fv, gu, gv - d * k2).re1;
}

int main() {
    std::printf("Topic 1 — linear stability and the Turing instability\n\n");
    std::printf("[1] Classification of 2x2 linear systems (trace T, determinant Delta)\n");
    double cases[6][4] = {{-1, 0, 0, -2}, {1, 0, 0, 2}, {1, 0, 0, -1}, {-0.5, -2, 2, -0.5}, {0.5, -2, 2, 0.5}, {0, -1, 1, 0}};
    for (auto& c : cases) {
        double T = c[0] + c[3], De = c[0] * c[3] - c[1] * c[2];
        Eig e = eig2(c[0], c[1], c[2], c[3]);
        std::printf("   A = [[%5.2f %5.2f] [%5.2f %5.2f]]  T = %5.2f  Delta = %5.2f  lambda = %.3f%+.3fi, %.3f%+.3fi  -> %s\n",
                    c[0], c[1], c[2], c[3], T, De, e.re1, e.im1, e.re2, e.im2, classify(c[0], c[1], c[2], c[3]).c_str());
    }
    std::printf("\n");

    double a = 12.0, b = 0.3, sigma = 50.0, dd = 1.0;
    double u = a / 5.0, v = 1 + u * u, q = 1 + u * u;
    double fu = (3 * u * u - 5) / q, fv = -4 * u / q, gu = sigma * 2 * b * u * u / q, gv = -sigma * b * u / q;
    double d = sigma * dd;
    std::printf("[2] Lengyel-Epstein model: a = %.0f, b = %.1f, sigma = %.0f, d = %.1f\n", a, b, sigma, dd);
    std::printf("   steady state u* = %.4f, v* = %.4f\n", u, v);
    std::printf("   J = [[%.4f %.4f] [%.4f %.4f]]\n", fu, fv, gu, gv);
    double T = fu + gv, De = fu * gv - fv * gu;
    std::printf("   without diffusion: T = %.4f (< 0), Delta = %.4f (> 0) -> %s\n", T, De, classify(fu, fv, gu, gv).c_str());
    double c1 = d * fu + gv, c2 = c1 * c1 / (4 * d);
    std::printf("   condition 1: d_eff*R11 + R22 = %.4f (> 0 needed)\n", c1);
    std::printf("   condition 2: Delta = %.4f < (d_eff*R11 + R22)^2/(4 d_eff) = %.4f\n", De, c2);
    double kc2 = c1 / (2 * d);
    std::printf("   k* (minimum of det) = %.4f, L_c = 2 pi/k* = %.4f\n", std::sqrt(kc2), 2 * M_PI / std::sqrt(kc2));
    double best_k = 0, best_l = -1e9;
    for (int i = 0; i <= 30000; ++i) {
        double k = 3.0 * i / 30000, l = lam_max(fu, fv, gu, gv, d, k);
        if (l > best_l) { best_k = k; best_l = l; }
    }
    std::printf("   fastest-growing mode (max Re lambda): k_m = %.4f, lambda_m = %.4f, wavelength 2 pi/k_m = %.4f\n", best_k, best_l, 2 * M_PI / best_k);
    double lo = -1, hi = -1;
    for (int i = 0; i <= 30000; ++i) {
        double k = 3.0 * i / 30000;
        if (lam_max(fu, fv, gu, gv, d, k) > 0) { if (lo < 0) lo = k; hi = k; }
    }
    std::printf("   unstable band: %.4f < k < %.4f\n", lo, hi);
    std::printf("   (min-det k* equals the fastest mode only at onset; here they differ by %.1f%%)\n", 100 * (std::sqrt(kc2) / best_k - 1));
    std::printf("\n");
    std::printf("[3] Critical diffusivity ratio: smallest d_eff giving a Turing band\n");
    double lo_d = 1.0, hi_d = 200.0;
    for (int it = 0; it < 80; ++it) {
        double m = 0.5 * (lo_d + hi_d), c1m = m * fu + gv;
        bool ok = c1m > 0 && De < c1m * c1m / (4 * m);
        if (ok) hi_d = m; else lo_d = m;
    }
    std::printf("   d_c = %.4f (sigma*d must exceed this)\n", hi_d);
    return 0;
}
