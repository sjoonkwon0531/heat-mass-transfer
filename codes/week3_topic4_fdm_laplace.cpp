// Week 3 - Topic 4: Numerical Solution of the 2D Laplace Equation by FDM
// 5-point stencil: T[i+1][j] + T[i-1][j] + T[i][j+1] + T[i][j-1] - 4*T[i][j] = 0
// Solved by Gauss-Seidel iteration (Liebmann method).
// Part 1: classic 4x4 heated plate (top=100, left=75, right=50, bottom=0)
// Part 2: 40x40 unit square, top side T=1, others 0
// Compile: g++ -O2 -std=c++17 week3_topic4_fdm_laplace.cpp -o topic4 && ./topic4

#include <cmath>
#include <cstdio>
#include <vector>

int gaussSeidel(std::vector<std::vector<double>>& T, double tol, int maxIter) {
    int ny = static_cast<int>(T.size());
    int nx = static_cast<int>(T[0].size());
    for (int it = 1; it <= maxIter; ++it) {
        double err = 0.0;
        for (int i = 1; i < ny - 1; ++i) {
            for (int j = 1; j < nx - 1; ++j) {
                double v = 0.25 * (T[i + 1][j] + T[i - 1][j] + T[i][j + 1] + T[i][j - 1]);
                err = std::fmax(err, std::fabs(v - T[i][j]));
                T[i][j] = v;
            }
        }
        if (err < tol) return it;
    }
    return maxIter;
}

int main() {
    // --- Part 1: 5x5 grid, 3x3 interior unknowns ---
    double top = 100.0, bottom = 0.0, left = 75.0, right = 50.0;
    std::vector<std::vector<double>> T(5, std::vector<double>(5, 0.0));
    for (int j = 0; j < 5; ++j) { T[4][j] = top; T[0][j] = bottom; }
    for (int i = 0; i < 5; ++i) { T[i][0] = left; T[i][4] = right; }
    // Corners are not used by interior stencils; leave as set above.
    int it1 = gaussSeidel(T, 1e-10, 100000);
    std::printf("Part 1: heated plate, 3x3 interior (Gauss-Seidel, %d iterations)\n", it1);
    for (int j = 3; j >= 1; --j) {
        std::printf(" ");
        for (int i = 1; i <= 3; ++i)
            std::printf("  T[%d,%d]=%7.3f", i, j, T[j][i]);
        std::printf("\n");
    }

    // --- Part 2: fine grid, normalized ---
    int n = 40;
    std::vector<std::vector<double>> U(n, std::vector<double>(n, 0.0));
    for (int j = 0; j < n; ++j) U[n - 1][j] = 1.0;  // top row = 1
    int it2 = gaussSeidel(U, 1e-6, 100000);
    std::printf("\nPart 2: %dx%d grid, top side T=1, others 0\n", n, n);
    std::printf("  converged in %d iterations\n", it2);
    std::printf("  T at center      = %.6f\n", U[n / 2][n / 2]);
    std::printf("  T at (0.5, 0.75) = %.6f\n", U[3 * n / 4][n / 2]);
    return 0;
}
