// Wk02 - Phonon dispersion of a 1D diatomic chain (CSV output)
// Build: g++ -O2 -std=c++17 wk02_phonon_dispersion.cpp -o phonon && ./phonon
// Output: phonon_dispersion.csv (ka, w_ac_r1, w_op_r1, w_ac_r2, ...)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

int main() {
    const double C = 1.0, M1 = 1.0, PI = 3.14159265358979;
    const std::vector<double> ratios = {1.0, 2.0, 4.0};
    const int N = 200;

    FILE* f = std::fopen("phonon_dispersion.csv", "w");
    std::fprintf(f, "ka");
    for (double r : ratios) std::fprintf(f, ",w_ac_r%g,w_op_r%g", r, r);
    std::fprintf(f, "\n");

    for (int i = 0; i <= N; ++i) {
        double ka = -PI / 2 + PI * i / N;
        std::fprintf(f, "%.5f", ka);
        for (double r : ratios) {
            double m2 = r * M1;
            double s = 1 / M1 + 1 / m2;
            double root = std::sqrt(s * s
                - 4 * std::sin(ka) * std::sin(ka) / (M1 * m2));
            std::fprintf(f, ",%.5f,%.5f",
                std::sqrt(C * (s - root)), std::sqrt(C * (s + root)));
        }
        std::fprintf(f, "\n");
    }
    std::fclose(f);
    std::puts("Wrote phonon_dispersion.csv (acoustic & optical branches)");
    return 0;
}
