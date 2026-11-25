// Week 15 · Topic 4 — Spinodal decomposition (Cahn-Hilliard, conserved) vs. domain coarsening
//                      (Allen-Cahn, non-conserved): explicit finite differences
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   f(c) = 1/4 - c^2/2 + c^4/4 (double well, c = +/-1 are the two phases),  mu = c^3 - c - gamma lap c
//   Cahn-Hilliard:  c_t = lap mu         (mean of c conserved)
//   Allen-Cahn:     c_t = -mu            (mean of c not conserved)
//   linear CH about c0: omega(q) = q^2 (1 - 3 c0^2) - gamma q^4  ->  q_m^2 = (1 - 3 c0^2)/(2 gamma)
//   grid spacing h = 1, periodic boundaries, 5-point Laplacian
#include <cmath>
#include <cstdint>
#include <initializer_list>
#include <cstdio>
#include <string>
#include <vector>

const int N = 64;
const double GAMMA = 1.0, DT = 0.01;
const double REPORT[4] = {10, 50, 100, 200};
typedef std::vector<double> Grid;

inline int id(int i, int j) { return ((i + N) % N) * N + (j + N) % N; }

Grid lcg_field(uint32_t seed) {
    Grid out(N * N);
    uint64_t s = seed;
    for (int i = 0; i < N * N; ++i) {
        s = (1664525ULL * s + 1013904223ULL) % 4294967296ULL;
        out[i] = (double)s / 4294967296.0;
    }
    return out;
}

void lap(const Grid& Z, Grid& L) {
    for (int i = 0; i < N; ++i)
        for (int j = 0; j < N; ++j)
            L[i * N + j] = ((Z[id(i - 1, j)] + Z[id(i + 1, j)]) + (Z[id(i, j - 1)] + Z[id(i, j + 1)])) - 4.0 * Z[i * N + j];
}

// numpy's mean uses pairwise summation; reproduce it for identical output digits
double pairwise(const double* a, long n) {
    if (n < 8) { double s = 0; for (long i = 0; i < n; ++i) s += a[i]; return s; }
    if (n <= 128) {
        double r[8];
        for (int k = 0; k < 8; ++k) r[k] = a[k];
        long i;
        for (i = 8; i < n - (n % 8); i += 8)
            for (int k = 0; k < 8; ++k) r[k] += a[i + k];
        double res = ((r[0] + r[1]) + (r[2] + r[3])) + ((r[4] + r[5]) + (r[6] + r[7]));
        for (; i < n; ++i) res += a[i];
        return res;
    }
    long n2 = n / 2; n2 -= n2 % 8;
    return pairwise(a, n2) + pairwise(a + n2, n - n2);
}

double chord_length(const Grid& c) {
    long n = 0;
    for (int i = 0; i < N; ++i)
        for (int j = 0; j < N; ++j) {
            bool s = c[i * N + j] > 0;
            if (s != (c[id(i - 1, j)] > 0)) ++n;
            if (s != (c[id(i, j - 1)] > 0)) ++n;
        }
    return n > 0 ? 2.0 * N * N / n : INFINITY;
}

void simulate(bool ch, double c0, Grid& c) {
    Grid r = lcg_field(2024);
    c.resize(N * N);
    for (int n = 0; n < N * N; ++n) c[n] = c0 + 0.1 * (r[n] - 0.5);
    Grid L(N * N), mu(N * N), Lmu(N * N);
    long step = 0;
    std::printf("     t      mean c     chord length    area fraction c > 0\n");
    for (double T : REPORT) {
        long target = std::lround(T / DT);
        while (step < target) {
            lap(c, L);
            for (int n = 0; n < N * N; ++n) mu[n] = ((c[n] * c[n]) * c[n] - c[n]) - GAMMA * L[n];
            if (ch) {
                lap(mu, Lmu);
                for (int n = 0; n < N * N; ++n) c[n] = c[n] + DT * Lmu[n];
            } else {
                for (int n = 0; n < N * N; ++n) c[n] = c[n] - DT * mu[n];
            }
            ++step;
        }
        double m = pairwise(c.data(), N * N) / (N * N);
        double a = 0; for (int n = 0; n < N * N; ++n) if (c[n] > 0) a += 1;
        double Lc = chord_length(c);
        char Ls[32];
        if (std::isfinite(Lc)) std::snprintf(Ls, sizeof Ls, "%8.3f", Lc); else std::snprintf(Ls, sizeof Ls, "  (none)");
        std::printf("   %5.0f   %+.6f   %s        %.4f\n", step * DT, m, Ls, a / (N * N));
    }
}

void ascii_map(const Grid& c, int rows = 16, int cols = 32) {
    for (int i = 0; i < rows; ++i) {
        std::string row;
        for (int j = 0; j < cols; ++j) row += c[(i * N / rows) * N + j * N / cols] > 0 ? '#' : '.';
        std::printf("   |%s|\n", row.c_str());
    }
}

int main() {
    std::printf("Topic 4 — Cahn-Hilliard vs. Allen-Cahn: N = %d, gamma = %.1f, dt = %.2f\n\n", N, GAMMA, DT);
    std::printf("[1] Linear stability of the uniform state c0 (Cahn-Hilliard)\n");
    for (double c0 : {0.0, -0.3, -0.5, -0.6}) {
        double a = 1 - 3 * c0 * c0;
        if (a <= 0) std::printf("   c0 = %+.1f: 1 - 3 c0^2 = %.2f <= 0 -> outside the spinodal, no linear growth\n", c0, a);
        else {
            double qm = std::sqrt(a / (2 * GAMMA));
            std::printf("   c0 = %+.1f: q_c = %.4f, q_m = %.4f, lambda_m = %.3f, omega_max = %.4f\n", c0, std::sqrt(a / GAMMA), qm, 2 * M_PI / qm, a * a / (4 * GAMMA));
        }
    }
    std::printf("\n");
    struct Case { bool ch; double c0; } cases[3] = {{true, 0.0}, {true, -0.3}, {false, 0.0}};
    for (auto& cs : cases) {
        std::printf("[%s, c0 = %+.1f]\n", cs.ch ? "Cahn-Hilliard" : "Allen-Cahn", cs.c0);
        Grid c;
        simulate(cs.ch, cs.c0, c);
        ascii_map(c);
        std::printf("\n");
    }
    return 0;
}
