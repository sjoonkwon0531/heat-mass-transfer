// Wk01 - 1D random walk -> Gaussian diffusion (CSV output)
// Build: g++ -O2 -std=c++17 wk01_random_walk.cpp -o walk && ./walk
// Output: walk_hist.csv (x, count), walk_msd.csv (n, msd)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <random>
#include <vector>
#include <cmath>

int main() {
    const int NP = 20000, NSTEP = 400;
    std::mt19937 rng(1);
    std::bernoulli_distribution coin(0.5);

    std::vector<double> pos(NP, 0.0), msd(NSTEP + 1, 0.0);
    for (int n = 1; n <= NSTEP; ++n) {
        double s2 = 0.0;
        for (int i = 0; i < NP; ++i) {
            pos[i] += coin(rng) ? 1.0 : -1.0;
            s2 += pos[i] * pos[i];
        }
        msd[n] = s2 / NP;
    }

    // histogram
    const int NB = 61; const double XMAX = 4.0 * std::sqrt((double)NSTEP);
    std::vector<int> hist(NB, 0);
    for (int i = 0; i < NP; ++i) {
        int b = (int)((pos[i] + XMAX) / (2 * XMAX) * NB);
        if (b >= 0 && b < NB) hist[b]++;
    }
    FILE* f1 = std::fopen("walk_hist.csv", "w");
    std::fprintf(f1, "x,count\n");
    for (int b = 0; b < NB; ++b) {
        double x = -XMAX + (b + 0.5) * 2 * XMAX / NB;
        std::fprintf(f1, "%.3f,%d\n", x, hist[b]);
    }
    std::fclose(f1);

    FILE* f2 = std::fopen("walk_msd.csv", "w");
    std::fprintf(f2, "n,msd,theory\n");
    for (int n = 0; n <= NSTEP; ++n)
        std::fprintf(f2, "%d,%.4f,%d\n", n, msd[n], n);
    std::fclose(f2);

    std::printf("Done. sigma(sim) = %.2f, theory = %.2f\n",
                std::sqrt(msd[NSTEP]), std::sqrt((double)NSTEP));
    return 0;
}
