// Week 15 · Topic 2 — Gray-Scott reaction-diffusion patterns (explicit finite differences)
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   U + 2V -> 3V,  V -> P,  U fed at rate F, both drained:
//   U_t = Du lap U - U V^2 + F (1 - U)
//   V_t = Dv lap V + U V^2 - (F + k) V
//   grid spacing 1, time step 1, periodic boundaries, 5-point Laplacian
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <string>
#include <vector>

const int N = 96;
const double DU = 0.16, DV = 0.08, DT = 1.0;
const int STEPS = 6000;
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

double lap(const Grid& Z, int i, int j) {
    // same order as numpy: (up + down) + (left + right) - 4 Z
    return ((Z[id(i - 1, j)] + Z[id(i + 1, j)]) + (Z[id(i, j - 1)] + Z[id(i, j + 1)])) - 4.0 * Z[id(i, j)];
}

void run(double F, double k, Grid& U, Grid& V) {
    U.assign(N * N, 1.0);
    V.assign(N * N, 0.0);
    Grid r = lcg_field(12345);
    int c0 = N / 2 - 8, c1 = N / 2 + 8;
    for (int i = c0; i < c1; ++i)
        for (int j = c0; j < c1; ++j) { U[i * N + j] = 0.50; V[i * N + j] = 0.25; }
    for (int n = 0; n < N * N; ++n) { U[n] = U[n] + 0.02 * (r[n] - 0.5); V[n] = V[n] + 0.02 * (r[n] - 0.5); }
    Grid Un(N * N), Vn(N * N);
    for (int s = 0; s < STEPS; ++s) {
        for (int i = 0; i < N; ++i)
            for (int j = 0; j < N; ++j) {
                int n = i * N + j;
                double uvv = (U[n] * V[n]) * V[n];
                Un[n] = U[n] + DT * ((DU * lap(U, i, j) - uvv) + F * (1.0 - U[n]));
                Vn[n] = V[n] + DT * ((DV * lap(V, i, j) + uvv) - (F + k) * V[n]);
            }
        U.swap(Un);
        V.swap(Vn);
    }
}

void ascii_map(const Grid& V, int rows = 24, int cols = 48) {
    const char* chars = " .:-=+*#%@";
    for (int i = 0; i < rows; ++i) {
        std::string row;
        for (int j = 0; j < cols; ++j) {
            double v = V[(i * N / rows) * N + j * N / cols];
            int idx = (int)std::fmin(9.0, std::fmax(0.0, v / 0.4 * 9.999));
            row += chars[idx];
        }
        std::printf("   |%s|\n", row.c_str());
    }
}

int main() {
    std::printf("Topic 2 — Gray-Scott patterns: N = %d, Du = %.2f, Dv = %.2f, dt = %.1f, %d steps\n\n", N, DU, DV, DT, STEPS);
    std::printf("[1] Homogeneous states: (U, V) = (1, 0) always; nontrivial states need\n");
    std::printf("    F/(F+k)^2 >= 4 i.e. V = [1 +/- sqrt(1 - 4(F+k)^2/F)] F/(2(F+k))\n");
    double hs[3][2] = {{0.035, 0.060}, {0.040, 0.060}, {0.060, 0.062}};
    for (auto& h : hs) {
        double F = h[0], k = h[1], disc = 1 - 4 * (F + k) * (F + k) / F;
        if (disc >= 0)
            std::printf("    F = %.3f, k = %.3f: V = %.4f, %.4f\n", F, k, (1 + std::sqrt(disc)) * F / (2 * (F + k)), (1 - std::sqrt(disc)) * F / (2 * (F + k)));
        else
            std::printf("    F = %.3f, k = %.3f: only the trivial state\n", F, k);
    }
    std::printf("\n");
    const char* names[3] = {"spots", "stripes/labyrinth", "mixed"};
    double pr[3][2] = {{0.035, 0.065}, {0.060, 0.062}, {0.025, 0.060}};
    for (int p = 0; p < 3; ++p) {
        Grid U, V;
        run(pr[p][0], pr[p][1], U, V);
        double su = 0, sv = 0, cnt = 0;
        for (int n = 0; n < N * N; ++n) { su += U[n]; sv += V[n]; if (V[n] > 0.2) cnt += 1; }
        std::printf("[%s] F = %.3f, k = %.3f\n", names[p], pr[p][0], pr[p][1]);
        std::printf("   mean U = %.5f, mean V = %.5f, area fraction V > 0.2 = %.4f\n", su / (N * N), sv / (N * N), cnt / (N * N));
        ascii_map(V);
        std::printf("\n");
    }
    return 0;
}
