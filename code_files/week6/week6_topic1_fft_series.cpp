// Week 6 - Topic 1: Generalized Fourier Series & the Finite Fourier Transform (FFT)
// Dirichlet-Dirichlet basis Phi_n = sqrt(2) sin(n pi x); a linear PDE becomes
// one ODE per mode: psi_n = <Phi_n, Theta>.
// Demos: Gibbs overshoot for f = 1; transient membrane -> steady at t ~ 0.3;
// 2D semi-infinite strip spot values; orthonormality check.
// Compile: g++ -O2 -std=c++17 week6_topic1_fft_series.cpp -o topic1 && ./topic1

#include <cmath>
#include <cstdio>
#include <cassert>
#include <algorithm>
#include <initializer_list>

static const double PI = 3.14159265358979323846;

double sineSeriesOfOne(double x, int N) {
    double s = 0.0;
    for (int n = 1; n <= N; ++n)
        s += 2.0 * (1 - (n % 2 == 0 ? 1 : -1)) / (n * PI) * std::sin(n * PI * x);
    return s;
}

double membraneTheta(double x, double t, int nmax = 199) {
    double s = 1.0 - x;
    for (int n = 1; n <= nmax; ++n)
        s -= 2.0 * std::exp(-std::pow(n * PI, 2) * t) * std::sin(n * PI * x) / (n * PI);
    return s;
}

double stripT(double x, double y, int kmax = 200, double T1 = 1.0) {
    double s = 0.0;
    for (int k = 0; k < kmax; ++k) {
        int n = 2 * k + 1;
        s += std::exp(-n * PI * y) * std::sin(n * PI * x) / n;
    }
    return 4.0 * T1 / PI * s;
}

int main() {
    std::printf("Fourier-sine series of f(x) = 1 (Gibbs ~1.179 = 1 + 2 x 8.95%%):\n");
    std::printf("  N      max of partial sum\n");
    for (int N : {9, 49, 199, 999}) {
        double m = 0.0;
        for (int i = 1; i < 4000; ++i)
            m = std::max(m, sineSeriesOfOne(i / 4000.0, N));
        std::printf("  %4d   %8.4f\n", N, m);
    }
    std::printf("  -> the overshoot never decays; it only squeezes toward the jump.\n");

    std::printf("\nTransient membrane, Theta(0.5, t) vs steady value 0.5:\n");
    std::printf("  t       Theta(0.5,t)   exp(-pi^2 t)\n");
    for (double t : {0.01, 0.05, 0.1, 0.2, 0.3, 0.5})
        std::printf("  %4.2f   %10.4f     %10.4f\n",
                    t, membraneTheta(0.5, t), std::exp(-PI * PI * t));
    std::printf("  -> exp(-pi^2*0.3) = %.4f ~ 0.05: steady state at t ~ 0.3 L^2/D.\n",
                std::exp(-PI * PI * 0.3));

    std::printf("\n2D strip solution (T1 = 1):\n");
    std::printf("  T(0.5, 0.25) = %.6f\n", stripT(0.5, 0.25));
    std::printf("  T(0.5, 0.50) = %.6f\n", stripT(0.5, 0.50));
    std::printf("  T(0.25, 0.10) = %.6f\n", stripT(0.25, 0.10));

    // orthonormality of sqrt(2) sin(n pi x)
    int N = 2000;
    double dx = 1.0 / N, dot = 0.0, norm = 0.0;
    for (int i = 0; i < N; ++i) {
        double x = (i + 0.5) * dx;
        dot += 2.0 * std::sin(2 * PI * x) * std::sin(3 * PI * x) * dx;
        norm += 2.0 * std::sin(2 * PI * x) * std::sin(2 * PI * x) * dx;
    }
    std::printf("\nOrthonormality: <Phi_2, Phi_3> = %.2e,  <Phi_2, Phi_2> = %.6f\n", dot, norm);

    assert(std::fabs(membraneTheta(0.0, 0.2) - 1.0) < 1e-6);
    assert(std::fabs(membraneTheta(1.0, 0.2)) < 1e-6);
    return 0;
}
