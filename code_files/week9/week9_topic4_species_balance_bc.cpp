// Week 9 - Topic 4: Species Balance, Interface Boundary Conditions and a CVD Film
// Henry's law p_A = x_A H_A(T) (lecture table, bar); Raoult p_A = x_A p_A*(T)
// W CVD: 3H2 + WF6 -> W + 6HF  ->  N_A(1 + 2 y_A) = -c D dy_A/dz
//   diffusion-limited: N_A = (c D/(2 delta)) ln[(1 + 2 y_A0)/(1 + 2 y_Ad)]
//   finite surface rate: N_A = k_s c y_Ad,  Da = k_s delta/D
// Build: g++ -O2 -std=c++17 week9_topic4_species_balance_bc.cpp -o topic4
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <vector>

double henry(const double* tab, double T) {
    const double Tt[6] = {273, 280, 290, 300, 310, 320};
    for (int k = 0; k < 5; ++k)
        if (T >= Tt[k] && T <= Tt[k + 1]) return tab[k] + (T - Tt[k]) / (Tt[k + 1] - Tt[k]) * (tab[k + 1] - tab[k]);
    return NAN;
}
double fluxA(double c, double D, double d, double y0, double yd) { return c * D / (2 * d) * std::log((1 + 2 * y0) / (1 + 2 * yd)); }

int main() {
    const double O2[6] = {25500, 30500, 37600, 45700, 52500, 56800};
    double H = henry(O2, 298.0), x = 0.21 / H, cO2 = x * 55.4e3;
    std::printf("O2 in water at 298 K: H = %.0f bar, x = %.3e, c = %.3f mol/m^3 = %.2f mg/L\n", H, x, cO2, cO2 * 32);

    double c = 101325.0 / (8.314462618 * 700.0), D = 1e-4, delta = 1e-3, y0 = 0.10;
    double Na = fluxA(c, D, delta, y0, 0.0), Nf = c * D * y0 / delta;
    // finite differences with Picard iteration on the face coefficient 1/(1+2y)
    const int n = 200;
    std::vector<double> y(n + 1);
    for (int i = 0; i <= n; ++i) y[i] = y0 * (1.0 - double(i) / n);
    for (int it = 0; it < 200; ++it) {
        std::vector<double> kf(n), a(n + 1, 0), b(n + 1, 1), cc(n + 1, 0), d(n + 1, 0);
        for (int i = 0; i < n; ++i) kf[i] = 1.0 / (1 + (y[i] + y[i + 1]));
        d[0] = y0; d[n] = 0.0;
        for (int i = 1; i < n; ++i) { a[i] = kf[i - 1]; cc[i] = kf[i]; b[i] = -(kf[i - 1] + kf[i]); }
        for (int i = 1; i <= n; ++i) { double m = a[i] / b[i - 1]; b[i] -= m * cc[i - 1]; d[i] -= m * d[i - 1]; }
        y[n] = d[n] / b[n];
        for (int i = n - 1; i >= 0; --i) y[i] = (d[i] - cc[i] * y[i + 1]) / b[i];
    }
    double h = delta / n, Nn = -c * D * (y[1] - y[0]) / h / (1 + (y[0] + y[1]));
    std::printf("\nW CVD: analytic N_A = %.5e, FDM N_A = %.5e, pure Fick = %.5e mol/m^2 s (factor %.4f)\n", Na, Nn, Nf, Na / Nf);
    for (double Da : {0.1, 1.0, 10.0, 100.0}) {
        double ks = Da * D / delta, lo = 0, hi = y0;
        for (int k = 0; k < 200; ++k) {
            double mid = 0.5 * (lo + hi);
            if (fluxA(c, D, delta, y0, mid) - ks * c * mid > 0) lo = mid; else hi = mid;
        }
        double yd = 0.5 * (lo + hi);
        std::printf("  Da = %6.1f: y_A(surface) = %.4f, N_A = %.4e (%5.1f%% of limit)\n", Da, yd, ks * c * yd, ks * c * yd / Na * 100);
    }
    return 0;
}
