// Week 10 - Topic 4: Two-Dimensional Steady Diffusion (Laplace Equation)
// Lecture (Part 2):
//   * rectangle 0<x<W, 0<y<H: c = 0 on x=0, x=W, y=0; c = c0 on y=H
//       c/c0 = sum_{n odd} (4/(n pi)) sin(n pi x/W) sinh(n pi y/W)/sinh(n pi H/W)
//   * TEOS stagnant gas between two wafers (LPCVD furnace): cylindrical (r, z)
//       (1/r) d/dr(r dc/dr) + d^2c/dz^2 = 0
//       c = c_A0 at r = R (open edge), c = 0 at z = 0 (fast surface reaction on the wafer),
//       dc/dr = 0 at r = 0, dc/dz = 0 at z = L/2 (mid-plane symmetry)
//     deposition flux on the wafer N(r) = D dc/dz|_{z=0}: the edge receives more than the center.
//   * extension: finite surface rate D dc/dz = ks c at the wafer, Da = ks L/D.
//     For a thin gap (L << R) the gap-averaged balance gives a Bessel problem:
//       c = c_A0 I0(m r)/I0(m R),  m^2 = 2 ks/(D L),  Thiele modulus Phi = m R
//     centre/edge deposition ratio = 1/I0(Phi): uniform wafers need Phi < ~0.5
//     (reaction-limited LPCVD), which is why TEOS furnaces can stack wafers closely.

// Build: g++ -O2 -std=c++17 week10_topic4_laplace_2d.cpp -o topic4
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <vector>

const double PI = 3.14159265358979323846;
using Grid = std::vector<std::vector<double>>;

double rectSeries(double x, double y, double W = 1.0, double H = 1.0, int nterms = 101) {
    double s = 0.0;
    for (int n = 1; n <= nterms; n += 2) {
        double a = n * PI / W;
        double ratio = std::exp(a * (y - H)) * (1 - std::exp(-2 * a * y)) / (1 - std::exp(-2 * a * H));
        s += 4 / (n * PI) * std::sin(a * x) * ratio;
    }
    return s;
}

int rectSOR(Grid& c, int N = 40, double omega = 1.85, double tol = 1e-9) {
    c.assign(N + 1, std::vector<double>(N + 1, 0.0));
    for (int i = 1; i < N; ++i) c[N][i] = 1.0;
    for (int it = 0; it < 20000; ++it) {
        double err = 0;
        for (int j = 1; j < N; ++j)
            for (int i = 1; i < N; ++i) {
                double nw = 0.25 * (c[j][i - 1] + c[j][i + 1] + c[j - 1][i] + c[j + 1][i]);
                double d = omega * (nw - c[j][i]); c[j][i] += d; err = std::fmax(err, std::fabs(d));
            }
        if (err < tol) return it + 1;
    }
    return 20000;
}

double I0(double x) {
    double s = 1.0, term = 1.0;
    for (int k = 1;; ++k) { term *= (x / (2 * k)) * (x / (2 * k)); s += term; if (term < 1e-16 * s) return s; }
}
double thinGap(double r, double R, double Da, double L) { double m = std::sqrt(2 * Da) / L; return I0(m * r) / I0(m * R); }

int waferSOR(Grid& c, double Da, double R = 1.0, double L = 0.1, int Nr = 80, int Nz = 10, double omega = 1.9, double tol = 1e-10) {
    double dr = R / Nr, dz = (L / 2) / Nz, ar = 1 / (dr * dr), az = 1 / (dz * dz), beta = 2 * dz * Da / L;
    c.assign(Nz + 1, std::vector<double>(Nr + 1, 0.0));
    for (int j = 0; j <= Nz; ++j) c[j][Nr] = 1.0;
    for (int it = 0; it < 200000; ++it) {
        double err = 0;
        for (int j = 1; j <= Nz; ++j)
            for (int i = 0; i < Nr; ++i) {
                double up = j < Nz ? c[j + 1][i] : c[j - 1][i], dn = c[j - 1][i], nw;
                if (i == 0) nw = (4 * ar * c[j][1] + az * (up + dn)) / (4 * ar + 2 * az);
                else {
                    double r = i * dr, w = (1 - dr / (2 * r)) * ar, e = (1 + dr / (2 * r)) * ar;
                    nw = (w * c[j][i - 1] + e * c[j][i + 1] + az * (up + dn)) / (2 * ar + 2 * az);
                }
                double d = omega * (nw - c[j][i]); c[j][i] += d; err = std::fmax(err, std::fabs(d));
            }
        for (int i = 0; i < Nr; ++i) {
            double nw = (4 * c[1][i] - c[2][i]) / (3 + beta);
            err = std::fmax(err, std::fabs(nw - c[0][i])); c[0][i] = nw;
        }
        if (err < tol) return it + 1;
    }
    return 200000;
}

int main() {
    Grid cs; int its = rectSOR(cs);
    std::printf("Rectangle W = H = 1, c/c0 at (x, y):\n");
    double pts[4][2] = {{0.5, 0.5}, {0.25, 0.75}, {0.5, 0.9}, {0.1, 0.5}};
    for (auto& p : pts) {
        int i = (int)std::lround(p[0] * 40), j = (int)std::lround(p[1] * 40);
        std::printf("  (%.2f,%.2f)  series = %.5f   SOR(40x40) = %.5f\n", p[0], p[1], rectSeries(p[0], p[1]), cs[j][i]);
    }
    std::printf("  SOR iterations: %d    centre value exact = 0.25 by superposition\n", its);
    std::printf("  Gibbs: partial sums at (0.02, 1.0): [%.4f, %.4f, %.4f]\n", rectSeries(0.02, 1, 1, 1, 5), rectSeries(0.02, 1, 1, 1, 21), rectSeries(0.02, 1, 1, 1, 101));

    std::printf("\nTEOS wafer gap: R = 1, gap L = 0.1, Robin BC with Da = ks L/D\n");
    std::printf("  Thiele modulus Phi = R sqrt(2 Da)/L ; centre/edge deposition = 1/I0(Phi)\n");
    std::printf("  Da        Phi     FDM centre/edge   thin-gap 1/I0(Phi)   SOR its\n");
    Grid c;
    for (double Da : {1e-4, 1e-3, 1e-2, 5e-2}) {
        int k = waferSOR(c, Da);
        std::printf("  %7.1e  %6.3f   %.4f            %.4f             %d\n", Da, std::sqrt(2 * Da) / 0.1, c[0][0], thinGap(0, 1, Da, 0.1), k);
    }
    std::printf("  radial profile at Da = 1e-2 (Phi = 1.414):\n");
    waferSOR(c, 1e-2);
    for (double f : {0.0, 0.25, 0.5, 0.75, 1.0}) {
        int i = (int)std::lround(f * 80);
        std::printf("    r/R = %4.2f   FDM c_wafer = %.4f   thin-gap = %.4f\n", f, c[0][i], thinGap(f, 1, 1e-2, 0.1));
    }
}
