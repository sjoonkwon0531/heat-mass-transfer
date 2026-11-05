// Week 11 - Topic 4: Spherical Coordinates - Reaction in a Catalyst Pellet and Legendre Polynomials
// Lecture (Part 3):
//   * radial problem (w = r^2, p = r^2): (1/r^2)(r^2 F')' = -lambda^2 F -> F = sin(lambda r)/r (spherical Bessel j0)
//       Type 1 F(1) = 0: lambda_n = n pi;  Type 2 F'(1) = 0: lambda = tan(lambda);
//       Type 3 F'(1) + A F(1) = 0: lambda = (1 - A) tan(lambda)
//   * Ex 1, steady first-order reaction in a sphere, Da = k R^2/D (= phi^2, Thiele modulus squared):
//       Theta = sinh(sqrt(Da) r)/(r sinh(sqrt(Da))),  effectiveness eta = 3 (phi coth phi - 1)/phi^2
//   * Ex 2, transient start-up, Theta(r,0) = 0:
//       Theta = steady + 2 sum_n (n pi)(-1)^n/((n pi)^2 + Da) exp(-((n pi)^2 + Da) t) sin(n pi r)/r
//   * polar problem (eta = cos(theta)): Legendre polynomials, int P_n P_m = 2/(2n+1) delta_nm
//   * Ex 3, sphere (k_B) in a matrix (k_A) under a uniform gradient, gamma = k_B/k_A:
//       inside gradient = 3/(2 + gamma);  Maxwell: k_eff/k_A = (gamma + 2 + 2f(gamma - 1))/(gamma + 2 - f(gamma - 1))
// Build: g++ -O2 -std=c++17 week11_topic4_sphere_reaction_legendre.cpp -o topic4
#include <cmath>
#include <cstdio>
#include <functional>
#include <initializer_list>
#include <vector>

const double PI = 3.14159265358979323846;

double steadyProfile(double r, double Da) {
    double p = std::sqrt(Da);
    if (r < 1e-12) return p / std::sinh(p);
    return std::sinh(p * r) / (r * std::sinh(p));
}

double effectiveness(double phi) { return 3.0 * (phi / std::tanh(phi) - 1.0) / (phi * phi); }

double transient(double r, double t, double Da, int nterms = 400) {
    double s = steadyProfile(r, Da);
    for (int n = 1; n <= nterms; ++n) {
        double a = n * PI;
        double shape = r < 1e-12 ? a : std::sin(a * r) / r;
        s += 2.0 * a * ((n % 2) ? -1.0 : 1.0) / (a * a + Da) * std::exp(-(a * a + Da) * t) * shape;
    }
    return s;
}

std::vector<double> fvTransient(double tEnd, double Da, int N = 60) {
    double dr = 1.0 / N;
    int steps = int(tEnd / (0.15 * dr * dr)) + 1;
    double dt = tEnd / steps;
    std::vector<double> vol(N), th(N, 0.0), nw(N);
    for (int i = 0; i < N; ++i) vol[i] = (std::pow(i + 1, 3) - std::pow(i, 3)) * dr * dr * dr / 3.0;
    for (int s = 0; s < steps; ++s) {
        for (int i = 0; i < N; ++i) {
            double aw = std::pow(i * dr, 2), ae = std::pow((i + 1) * dr, 2);
            double fw = i > 0 ? aw * (th[i] - th[i - 1]) / dr : 0.0;
            double fe = (i < N - 1) ? ae * (th[i + 1] - th[i]) / dr : ae * (1.0 - th[i]) / (dr / 2);
            nw[i] = th[i] + dt * ((fe - fw) / vol[i] - Da * th[i]);
        }
        th = nw;
    }
    return th;
}

double legendre(int n, double x) {
    double p0 = 1.0, p1 = x;
    if (n == 0) return p0;
    for (int k = 1; k < n; ++k) {
        double p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1);
        p0 = p1; p1 = p2;
    }
    return p1;
}

double simpsonPM1(const std::function<double(double)>& f, int m = 40) {
    int n = 2 * m;
    double h = 2.0 / n, s = f(-1.0) + f(1.0);
    for (int i = 1; i < n; ++i) s += (i % 2 ? 4 : 2) * f(-1.0 + i * h);
    return s * h / 3;
}

double maxwell(double g, double f) { return (g + 2 + 2 * f * (g - 1)) / (g + 2 - f * (g - 1)); }

double root(const std::function<double(double)>& f, double a, double b) {
    for (int i = 0; i < 100; ++i) {
        double c = 0.5 * (a + b);
        if (f(a) * f(c) <= 0) b = c; else a = c;
    }
    return 0.5 * (a + b);
}

int main() {
    std::printf("=== 1. Steady reaction in a sphere: profile and effectiveness factor ===\n");
    for (double Da : {0.25, 1.0, 9.0, 100.0}) {
        double phi = std::sqrt(Da);
        std::printf("  Da = %6.2f (phi = %5.2f): centre Theta = %.4f, eta = %.4f, large-phi limit 3/phi = %.4f\n",
                    Da, phi, steadyProfile(0, Da), effectiveness(phi), 3 / phi);
    }

    std::printf("\n=== 2. Transient start-up (Ex 2): series vs finite volume, Da = 9 ===\n");
    double Da = 9.0;
    for (double t : {0.02, 0.1, 0.5}) {
        std::vector<double> th = fvTransient(t, Da);
        std::printf("  t = %4.2f: centre series = %.5f, FV = %.5f  (steady %.5f)\n", t, transient(0, t, Da), th[0], steadyProfile(0, Da));
    }
    std::printf("  check t = 0: Theta(0.5, 0) = %.4f (should be 0)\n", transient(0.5, 0.0, Da, 4000));
    std::printf("  slowest decay rate pi^2 + Da = %.3f: reaction speeds up the approach to steady state\n", PI * PI + Da);

    std::printf("\n=== 3. Radial eigenvalues of a sphere ===\n");
    std::printf("  Type 1: n pi = [%.4f, %.4f, %.4f]\n", PI, 2 * PI, 3 * PI);
    std::printf("  Type 2 (lambda = tan lambda): [");
    for (int k = 1; k <= 3; ++k)
        std::printf("%s%.4f", k > 1 ? ", " : "",
                    root([](double x) { return std::sin(x) - x * std::cos(x); }, (k + 0.5) * PI - 0.5, (k + 0.5) * PI - 1e-9));
    std::printf("]\n");

    std::printf("\n=== 4. Legendre polynomials: orthogonality ===\n");
    for (int n = 0; n < 4; ++n) {
        std::printf("  ");
        for (int m = 0; m < 4; ++m) std::printf(" %+.4f", simpsonPM1([&](double x) { return legendre(n, x) * legendre(m, x); }));
        std::printf("    2/(2n+1) = %.4f\n", 2.0 / (2 * n + 1));
    }

    std::printf("\n=== 5. Sphere in a gradient: Maxwell effective conductivity ===\n");
    std::printf("  gamma = kB/kA   inside gradient 3/(2+gamma)   k_eff/k_A at f = 0.1, 0.3\n");
    for (double g : {0.0, 0.1, 1.0, 10.0, 100.0})
        std::printf("  %7.1f          %.4f                  %.4f, %.4f\n", g, 3 / (2 + g), maxwell(g, 0.1), maxwell(g, 0.3));
    std::printf("  case: thermal interface material, epoxy kA = 0.2 W/m/K with alumina kB = 30 W/m/K\n");
    for (double f : {0.1, 0.3, 0.5}) std::printf("    f = %.1f: k_eff = %.3f W/m/K\n", f, 0.2 * maxwell(150.0, f));
    std::printf("  -> even very conductive fillers raise k_eff by at most (1 + 2f)/(1 - f) in the dilute model\n");
    return 0;
}
