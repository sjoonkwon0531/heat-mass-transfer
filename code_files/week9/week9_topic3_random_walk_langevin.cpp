// Week 9 - Topic 3: Random Walk, Langevin Dynamics and the Diffusivity
// Langevin (one component, m = kB T = 1): dv = -gamma v dt + sqrt(2 kappa dt) N(0,1), kappa = gamma
//   <x^2> = (2/gamma)[t - (1 - exp(-gamma t))/gamma] -> 2 D t with D = kB T/(m gamma) = 1/gamma
//   Green-Kubo: D = int <v(t)v(0)> dt = int exp(-gamma t) dt = 1/gamma
// Porous lattice walk: blind ant on a periodic square lattice with open-site fraction eps.
// Build: g++ -O2 -std=c++17 week9_topic3_random_walk_langevin.cpp -o topic3
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <random>
#include <vector>

int main() {
    std::mt19937 rng(7);
    std::normal_distribution<double> N01(0.0, 1.0);
    const double gamma = 2.0, dt = 0.01;
    const int nwalk = 4000, nsteps = 2000;
    const double amp = std::sqrt(2 * gamma * dt);
    std::vector<double> x(nwalk, 0.0), v(nwalk), v0(nwalk);
    for (int i = 0; i < nwalk; ++i) v[i] = v0[i] = N01(rng);
    std::printf("Langevin, gamma = %.1f, D_theory = %.3f\n   t     MSD_sim   MSD_exact   VACF_sim  VACF_exact\n",
                gamma, 1 / gamma);
    double m1 = 0, t1 = 0;
    for (int k = 1; k <= nsteps; ++k) {
        for (int i = 0; i < nwalk; ++i) {
            v[i] += -gamma * v[i] * dt + amp * N01(rng);
            x[i] += v[i] * dt;
        }
        if (k % 200 == 0) {
            double t = k * dt, msd = 0, vacf = 0;
            for (int i = 0; i < nwalk; ++i) { msd += x[i] * x[i]; vacf += v[i] * v0[i]; }
            msd /= nwalk; vacf /= nwalk;
            double ex = 2 / gamma * (t - (1 - std::exp(-gamma * t)) / gamma);
            std::printf("%6.2f  %9.4f  %9.4f   %8.4f  %8.4f\n", t, msd, ex, vacf, std::exp(-gamma * t));
            if (k == 1000) { m1 = msd; t1 = t; }
            if (k == nsteps) std::printf("Long-time D = %.3f (theory %.3f)\n", (msd - m1) / (t - t1) / 2, 1 / gamma);
        }
    }
    // porous lattice
    std::uniform_real_distribution<double> U(0.0, 1.0);
    std::uniform_int_distribution<int> dir(0, 3);
    const int L = 64, nw = 500, ns = 3000;
    const int di[4] = {1, -1, 0, 0}, dj[4] = {0, 0, 1, -1};
    std::printf("\nPorous lattice walk\n  porosity   D_eff/D_0   eps^2\n");
    for (double eps : {1.0, 0.9, 0.8, 0.7, 0.6, 0.5}) {
        std::mt19937 g(1);
        std::vector<char> open(L * L);
        std::vector<int> voids;
        for (int s = 0; s < L * L; ++s) { open[s] = U(g) < eps; if (open[s]) voids.push_back(s); }
        std::uniform_int_distribution<size_t> pick(0, voids.size() - 1);
        double msd = 0;
        for (int w = 0; w < nw; ++w) {
            int s = voids[pick(g)], i = s / L, j = s % L, X = 0, Y = 0;
            for (int n = 0; n < ns; ++n) {
                int d = dir(g), ni = (i + di[d] + L) % L, nj = (j + dj[d] + L) % L;
                if (open[ni * L + nj]) { i = ni; j = nj; X += di[d]; Y += dj[d]; }
            }
            msd += double(X) * X + double(Y) * Y;
        }
        std::printf("   %4.2f      %7.3f    %5.3f\n", eps, msd / nw / ns, eps * eps);
    }
    return 0;
}
