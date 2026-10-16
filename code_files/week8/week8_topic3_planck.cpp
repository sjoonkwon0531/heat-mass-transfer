// Week 8 - Topic 3: Planck's Law, Wien's Displacement, Stefan-Boltzmann
// Cavity mode counting: g(nu) dnu = 8 pi V nu^2/c^3 dnu.
// Equipartition (<E> = kB T) -> Rayleigh-Jeans -> ultraviolet catastrophe.
// Planck (E_n = n h nu) -> <E> = h nu/(exp(h nu/kB T) - 1) ->
//   F_lambda = (2 pi h c^2/lambda^5)/(exp(hc/lambda kB T) - 1)
// Checks: sigma = 2 pi^5 kB^4/(15 h^3 c^2) = 5.670e-8; Wien x = 4.965 ->
// lambda_C T = 2.898e-3 m K; frequency form x = 2.821; Sun -> 500 nm.
// Build: g++ -O2 -std=c++17 week8_topic3_planck.cpp -o planck && ./planck

#include <cmath>
#include <cstdio>
#include <initializer_list>

const double H = 6.62607015e-34, C = 2.99792458e8, KB = 1.380649e-23;

double planck(double lam, double T) {
    double x = H * C / (lam * KB * T);
    if (x > 700.0) return 0.0;
    return 2.0 * M_PI * H * C * C / std::pow(lam, 5) / std::expm1(x);
}

double rayleigh_jeans(double lam, double T) {
    return 2.0 * M_PI * C * KB * T / std::pow(lam, 4);
}

double solve_wien(double a) {
    auto f = [a](double x) { return x * std::exp(x) / std::expm1(x) - a; };
    double lo = 0.5, hi = 10.0;
    for (int i = 0; i < 200; ++i) {
        double mid = 0.5 * (lo + hi);
        if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
    }
    return 0.5 * (lo + hi);
}

int main() {
    // --- Stefan-Boltzmann constant ---
    const double sigma = 2.0 * std::pow(M_PI, 5) * std::pow(KB, 4) /
                         (15.0 * std::pow(H, 3) * C * C);
    std::printf("sigma = %.4e W/m^2 K^4 (lecture 5.670e-8)\n", sigma);

    // Bose-Einstein integral check: int x^3/(e^x - 1) = pi^4/15
    const int n = 400000;
    const double xmax = 60.0, dx = xmax / n;
    double I = 0.0;
    for (int i = 0; i < n; ++i) {
        double x = (i + 0.5) * dx;
        I += x * x * x / std::expm1(x) * dx;
    }
    std::printf("int x^3/(e^x-1) dx = %.6f (pi^4/15 = %.6f)\n\n",
                I, std::pow(M_PI, 4) / 15.0);

    // --- Wien displacement ---
    const double x5 = solve_wien(5.0), x3 = solve_wien(3.0);
    const double b = H * C / (x5 * KB);
    std::printf("Wien (lambda): x = %.4f (lecture 4.965) -> lambda_C T = %.4f mm K\n",
                x5, b * 1e3);
    std::printf("Wien (nu)    : x = %.4f (lecture 2.821) -> nu_C = 2.821 kB T/h\n", x3);
    const char* names[] = {"Sun", "human body", "furnace"};
    const double temps[] = {5800.0, 310.0, 1500.0};
    for (int i = 0; i < 3; ++i)
        std::printf("  %-11s T = %6.0f K -> lambda_C = %8.1f nm\n",
                    names[i], temps[i], b / temps[i] * 1e9);

    // --- total flux check ---
    const double T = 5800.0;
    const double lam_lo = 10e-9, lam_hi = 100e-6;
    const int nL = 20000;
    const double dlam = (lam_hi - lam_lo) / nL;
    double F = 0.0;
    for (int i = 0; i < nL; ++i) F += planck(lam_lo + (i + 0.5) * dlam, T) * dlam;
    std::printf("\nT = %.0f K: integral F_lambda = %.4e, sigma T^4 = %.4e W/m^2\n",
                T, F, sigma * std::pow(T, 4));

    // --- Rayleigh-Jeans vs Planck at 2000 K ---
    std::printf("\nF_lambda at 2000 K (W/m^2 um):  lambda    Planck     Rayleigh-Jeans\n");
    for (double lam_um : {0.2, 0.5, 1.0, 1.449, 3.0, 10.0}) {
        double l = lam_um * 1e-6;
        std::printf("  %8.3f um  %12.4e  %14.4e\n", lam_um,
                    planck(l, 2000.0) * 1e-6, rayleigh_jeans(l, 2000.0) * 1e-6);
    }
    std::printf("  -> RJ diverges as lambda^-4; Planck peaks at %.3f um and decays.\n",
                b / 2000.0 * 1e6);
    return 0;
}
