// Week 11 - Topic 1: Unsteady 1D Diffusion - Semi-Infinite Medium and Finite Slab
// Lecture (Part 1):
//   * Fick's second law (1D, no reaction, no bulk motion): dc/dt = D d2c/dz2
//   * semi-infinite medium, c(z,0) = c0, c(0,t) = cs, c(inf,t) = c0  (Laplace transform):
//       (c - c0)/(cs - c0) = erfc( z / (2 sqrt(D t)) )
//       surface flux  N(0,t) = (cs - c0) sqrt(D/(pi t))       (decays as t^-1/2)
//       uptake per area  W/S = 2 (cs - c0) sqrt(D t / pi)       (grows as t^1/2)
//   * finite slab 0 < z < L, c = cs on both faces, Y = (c - cs)/(c0 - cs):
//       Y = (4/pi) sum_k 1/(2k-1) sin((2k-1) pi z/L) exp(-(2k-1)^2 pi^2 D t / L^2)
//       fractional uptake  M(t)/M_inf = 1 - sum_k 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo),  Fo = D t/L^2
//   * case study (lecture): P diffusion into Si, cs = 2.5e20 cm^-3, target 2.5e18 cm^-3,
//     D = 6.5e-13 cm^2/s at 1373 K, t = 1 h  ->  erfc(phi) = 0.01, phi = 1.82, z = 1.76 um
// Build: g++ -O2 -std=c++17 week11_topic1_slab_semi_infinite.cpp -o topic1
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <vector>

const double PI = 3.14159265358979323846;

double erfcInv(double y) {
    double lo = 0.0, hi = 10.0;
    for (int i = 0; i < 200; ++i) {
        double mid = 0.5 * (lo + hi);
        if (std::erfc(mid) > y) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}

double slabSeries(double z, double t, double D, double L, int nterms = 200) {
    double s = 0.0;
    for (int k = 1; k <= nterms; ++k) {
        int m = 2 * k - 1;
        s += 4.0 / (m * PI) * std::sin(m * PI * z / L) * std::exp(-std::pow(m * PI / L, 2) * D * t);
    }
    return s;
}

double slabUptake(double Fo, int nterms = 200) {
    double s = 0.0;
    for (int k = 1; k <= nterms; ++k) {
        int m = 2 * k - 1;
        s += 8.0 / (m * m * PI * PI) * std::exp(-std::pow(m * PI, 2) * Fo);
    }
    return 1.0 - s;
}

std::vector<double> thomas(const std::vector<double>& a, const std::vector<double>& b,
                           const std::vector<double>& c, const std::vector<double>& d) {
    size_t n = d.size();
    std::vector<double> cp(n), dp(n), x(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (size_t i = 1; i < n; ++i) {
        double m = b[i] - a[i] * cp[i - 1];
        cp[i] = (i < n - 1) ? c[i] / m : 0.0;
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
    }
    x[n - 1] = dp[n - 1];
    for (int i = (int)n - 2; i >= 0; --i) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
}

std::vector<double> slabCrankNicolson(double FoEnd, int N = 100, int steps = 2000) {
    double h = 1.0 / N, dt = FoEnd / steps, r = dt / (h * h);
    std::vector<double> Y(N + 1, 1.0);
    Y[0] = Y[N] = 0.0;
    int n = N - 1;
    std::vector<double> a(n, -r / 2), b(n, 1 + r), c(n, -r / 2), d(n);
    for (int s = 0; s < steps; ++s) {
        for (int i = 1; i < N; ++i) d[i - 1] = r / 2 * Y[i - 1] + (1 - r) * Y[i] + r / 2 * Y[i + 1];
        std::vector<double> x = thomas(a, b, c, d);
        for (int i = 1; i < N; ++i) Y[i] = x[i - 1];
    }
    return Y;
}

int main() {
    std::printf("=== 1. Semi-infinite medium: profile, flux, uptake ===\n");
    double D = 1.0e-9, dc = 1.0;
    for (double t : {10.0, 100.0, 1000.0}) {
        std::printf("t = %7.0f s: sqrt(Dt) = %7.1f um, N(0) = %.3e mol/m2/s, uptake = %.3e mol/m2\n",
                    t, std::sqrt(D * t) * 1e6, dc * std::sqrt(D / (PI * t)), 2 * dc * std::sqrt(D * t / PI));
    }
    std::printf("  N(0) x sqrt(t) = dc sqrt(D/pi) = %.4e for every t\n", dc * std::sqrt(D / PI));

    std::printf("\n=== 2. Case: P doping of Si (lecture) ===\n");
    double cs = 2.5e20, ct = 2.5e18, Dp = 6.5e-13, tt = 3600.0;
    double phi = erfcInv(ct / cs);
    std::printf("erfc(phi) = %.3f  ->  phi = %.3f\n", ct / cs, phi);
    std::printf("depth for 2.5e18 cm^-3 after 1 h at 1373 K: z = %.2f um   (lecture: 1.76 um)\n",
                2 * phi * std::sqrt(Dp * tt) * 1e4);
    for (double hrs : {0.25, 1.0, 4.0})
        std::printf("  t = %4.2f h -> z = %.2f um  (depth ~ sqrt(t))\n", hrs, 2 * phi * std::sqrt(Dp * hrs * 3600) * 1e4);

    std::printf("\n=== 3. Finite slab: Fourier series vs Crank-Nicolson ===\n");
    for (double Fo : {0.01, 0.05, 0.2}) {
        std::vector<double> Y = slabCrankNicolson(Fo);
        double err = 0.0;
        for (int i = 0; i <= 100; ++i) err = std::fmax(err, std::fabs(Y[i] - slabSeries(i / 100.0, Fo, 1, 1)));
        std::printf("Fo = %4.2f: Y(centre) series = %.5f, CN = %.5f, max |diff| = %.1e\n",
                    Fo, slabSeries(0.5, Fo, 1, 1), Y[50], err);
    }
    std::printf("terms needed at t = 0+ (Gibbs): the series converges slowly near the faces;\n");
    for (int nt : {1, 5, 50})
        std::printf("  %3d terms: Y(z/L = 0.02, Fo = 0) = %.3f (exact 1)\n", nt, slabSeries(0.02, 0.0, 1, 1, nt));

    std::printf("\n=== 4. When is a slab 'semi-infinite'? ===\n");
    std::printf("  Fo      exact M/Minf   short-time 4 sqrt(Fo/pi)   error\n");
    for (double Fo : {0.001, 0.01, 0.03, 0.05, 0.1, 0.2}) {
        double ex = slabUptake(Fo), st = 4 * std::sqrt(Fo / PI);
        std::printf("  %5.3f   %.4f         %.4f                  %6.2f%%\n", Fo, ex, st, 100 * (st - ex) / ex);
    }
    std::printf("-> the two faces do not 'see' each other until Fo ~ 0.05 (error about 0.1%%)\n");
    return 0;
}
