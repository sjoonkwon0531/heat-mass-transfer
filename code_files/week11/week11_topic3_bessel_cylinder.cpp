// Week 11 - Topic 3: Sturm-Liouville Eigenfunctions in a Cylinder - Bessel Functions and the Heated Wire
// Lecture (Part 2):
//   * Sturm-Liouville operator L = (1/w) [d/dx (p d/dx) + q]; self-adjoint with homogeneous BCs
//     -> real eigenvalues, orthogonal eigenfunctions <u_m, u_n> = int u_m u_n w dx = 0 (m != n)
//   * cylinder (w = r, p = r, q = 0): (1/r)(r F')' = -lambda^2 F  ->  F = a J0(lambda r)  (Y0 diverges at r = 0)
//     Type 1  F(1) = 0          : J0(lambda) = 0           lambda = 2.405, 5.520, 8.654, ...
//     Type 2  F'(1) = 0         : J1(lambda) = 0           lambda = 0, 3.832, 7.016, 10.173, ...
//     Type 3  F'(1) + Bi F(1) = 0: lambda J1(lambda) = Bi J0(lambda)
//     normalisation  int_0^1 J0(lambda r)^2 r dr = [J0(lambda)^2 + J1(lambda)^2]/2
//   * Ex 1 (lecture): electrically heated wire, dTheta/dt = (1/r)(r Theta_r)_r + 1,
//     Theta(r,0) = 0, Theta_r(0) = 0, Theta_r(1) + Bi Theta(1) = 0  (finite Fourier transform):
//     Theta = 2 sum_n J1(l_n) J0(l_n r) / (l_n^3 J0(l_n)^2 (1 + (Bi/l_n)^2)) (1 - exp(-l_n^2 t))
//     steady state Theta_ss = 1/(2 Bi) + (1 - r^2)/4
//   Dimensionless: Theta = k (T - T_inf)/(q''' R^2), t = alpha t/R^2, Bi = h R/k.
// Bessel functions from J_n(x) = (1/pi) int_0^pi cos(n s - x sin s) ds (trapezoidal rule).
// Build: g++ -O2 -std=c++17 week11_topic3_bessel_cylinder.cpp -o topic3
#include <cmath>
#include <cstdio>
#include <functional>
#include <initializer_list>
#include <vector>

const double PI = 3.14159265358979323846;

double besselj(int n, double x, int m = 200) {
    double h = PI / m;
    double s = 0.5 * (std::cos(0.0) + std::cos(n * PI - x * std::sin(PI)));
    for (int k = 1; k < m; ++k) {
        double u = k * h;
        s += std::cos(n * u - x * std::sin(u));
    }
    return s * h / PI;
}

std::vector<double> roots(const std::function<double(double)>& f, double xmax = 20.0, double dx = 0.01) {
    std::vector<double> out;
    double x = 1e-9, fx = f(x);
    while (x < xmax) {
        double x2 = x + dx, f2 = f(x2);
        if (fx * f2 < 0) {
            double a = x, b = x2;
            for (int i = 0; i < 80; ++i) {
                double c = 0.5 * (a + b);
                if (f(a) * f(c) <= 0) b = c; else a = c;
            }
            out.push_back(0.5 * (a + b));
        }
        x = x2; fx = f2;
    }
    return out;
}

std::vector<double> eigenvalues(int bc, double Bi = 1.0, size_t n = 4) {
    std::vector<double> r;
    if (bc == 1) r = roots([](double x) { return besselj(0, x); });
    else if (bc == 2) { r = roots([](double x) { return besselj(1, x); }); r.insert(r.begin(), 0.0); }
    else r = roots([Bi](double x) { return x * besselj(1, x) - Bi * besselj(0, x); });
    if (r.size() > n) r.resize(n);
    return r;
}

double simpson(const std::function<double(double)>& f, double a, double b, int n = 400) {
    double h = (b - a) / n, s = f(a) + f(b);
    for (int i = 1; i < n; ++i) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
}

double wireSeries(double r, double t, double Bi, const std::vector<double>& lams) {
    double s = 0.0;
    for (double l : lams) {
        double J0l = besselj(0, l), J1l = besselj(1, l);
        s += 2 * J1l * besselj(0, l * r) / (l * l * l * J0l * J0l * (1 + (Bi / l) * (Bi / l))) * (1 - std::exp(-l * l * t));
    }
    return s;
}

std::vector<double> wireFD(double tEnd, double Bi, int N = 60) {
    double dr = 1.0 / N;
    int steps = int(tEnd / (0.2 * dr * dr)) + 1;
    double dt = tEnd / steps;
    std::vector<double> th(N, 0.0), nw(N);
    for (int s = 0; s < steps; ++s) {
        for (int i = 0; i < N; ++i) {
            double rw = i * dr, re = (i + 1) * dr, rc = (i + 0.5) * dr;
            double fw = i > 0 ? rw * (th[i] - th[i - 1]) / dr : 0.0, fe;
            if (i < N - 1) fe = re * (th[i + 1] - th[i]) / dr;
            else { double Ts = th[i] / (1 + Bi * dr / 2); fe = re * (Ts - th[i]) / (dr / 2); }
            nw[i] = th[i] + dt * ((fe - fw) / (rc * dr) + 1.0);
        }
        th = nw;
    }
    return th;
}

int main() {
    auto pr = [](const char* lab, const std::vector<double>& v) {
        std::printf("%s [", lab);
        for (size_t i = 0; i < v.size(); ++i) std::printf("%s%.4f", i ? ", " : "", v[i]);
        std::printf("]\n");
    };
    std::printf("=== 1. Eigenvalues for the three boundary-condition types ===\n");
    pr("  Type 1 (J0 = 0):", eigenvalues(1));
    pr("  Type 2 (J1 = 0):", eigenvalues(2));
    for (double Bi : {0.1, 1.0, 10.0}) {
        char lab[64];
        std::snprintf(lab, sizeof lab, "  Type 3, Bi = %4.1f:", Bi);
        pr(lab, eigenvalues(3, Bi));
    }

    std::printf("\n=== 2. Orthogonality (weight w = r) and normalisation ===\n");
    std::vector<double> lam = eigenvalues(1);
    for (int i = 0; i < 3; ++i) {
        std::printf("  ");
        for (int j = 0; j < 3; ++j)
            std::printf(" %+.6f", simpson([&](double r) { return besselj(0, lam[i] * r) * besselj(0, lam[j] * r) * r; }, 0, 1));
        std::printf("\n");
    }
    double l1 = lam[0];
    std::printf("  int J0(l1 r)^2 r dr = %.6f, formula (J0^2 + J1^2)/2 = %.6f\n",
                simpson([&](double r) { return std::pow(besselj(0, l1 * r), 2) * r; }, 0, 1),
                (std::pow(besselj(0, l1), 2) + std::pow(besselj(1, l1), 2)) / 2);

    std::printf("\n=== 3. Heated wire (Ex 1): series vs finite volume ===\n");
    double Bi = 1.0;
    std::vector<double> lams = eigenvalues(3, Bi, 30);
    for (double t : {0.05, 0.2, 1.0}) {
        std::vector<double> th = wireFD(t, Bi);
        std::printf("  t = %4.2f: centre series = %.5f, FV = %.5f;  surface series = %.5f\n",
                    t, wireSeries(0.0, t, Bi, lams), th[0], wireSeries(1.0, t, Bi, lams));
    }
    std::printf("  steady state 1/(2Bi) + 1/4 = %.5f; series at t = 10: %.5f\n", 1 / (2 * Bi) + 0.25, wireSeries(0, 10, Bi, lams));
    double target = 0.95 * (1 / (2 * Bi) + 0.25), lo = 0.0, hi = 10.0, mid = 0.0;
    for (int i = 0; i < 60; ++i) {
        mid = 0.5 * (lo + hi);
        if (wireSeries(0, mid, Bi, lams) < target) lo = mid; else hi = mid;
    }
    std::printf("  time to reach 95%% of the steady centre value: t = %.3f  (one-term estimate 3/lambda1^2 = %.3f)\n",
                mid, 3 / (lams[0] * lams[0]));

    std::printf("\n=== 4. Case: thin Pt wire, R = 25 um, in still air ===\n");
    double k = 71.6, alpha = 2.5e-5, h = 300.0, q = 1e9, R = 25e-6;
    double Biw = h * R / k, l1w = eigenvalues(3, Biw, 1)[0];
    std::printf("  Bi = hR/k = %.2e -> nearly uniform temperature (lumped), lambda1 = %.4f\n", Biw, l1w);
    std::printf("  steady rise T - T_inf = q R / (2 h) = %.1f K; time constant R^2/(alpha lambda1^2) = %.2f ms (lumped rho c R/(2h))\n",
                q * R / (2 * h), R * R / (alpha * l1w * l1w) * 1e3);
    return 0;
}
