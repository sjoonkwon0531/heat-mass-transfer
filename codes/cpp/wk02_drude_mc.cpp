// Wk02 - Drude model Monte-Carlo (1D, CSV output)
// Build: g++ -O2 -std=c++17 wk02_drude_mc.cpp -o drude && ./drude
// Output: drude_vd.csv (t, mean_v, theory)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <random>
#include <vector>

int main() {
    const int NE = 5000, NSTEP = 3000;
    const double DT = 0.01, TAU = 1.0, A = 0.5, U0 = 3.0;
    std::mt19937 rng(2);
    std::normal_distribution<double> gauss(0.0, U0);
    std::uniform_real_distribution<double> uni(0.0, 1.0);

    std::vector<double> v(NE);
    for (auto& x : v) x = gauss(rng);

    FILE* f = std::fopen("drude_vd.csv", "w");
    std::fprintf(f, "t,mean_v,theory\n");
    double vd_late = 0.0; int nlate = 0;
    for (int n = 0; n < NSTEP; ++n) {
        double s = 0.0;
        for (int i = 0; i < NE; ++i) {
            if (uni(rng) < DT / TAU) v[i] = gauss(rng);
            else                     v[i] += A * DT;
            s += v[i];
        }
        double vd = s / NE;
        if (n >= NSTEP / 2) { vd_late += vd; nlate++; }
        if (n % 10 == 0)
            std::fprintf(f, "%.2f,%.5f,%.5f\n", n * DT, vd, A * TAU);
    }
    std::fclose(f);
    std::printf("simulated v_d = %.4f | Drude a*tau = %.4f\n",
                vd_late / nlate, A * TAU);
    return 0;
}
