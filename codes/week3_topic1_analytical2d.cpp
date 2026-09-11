// Week 3 - Topic 1: 2D Steady-State Heat Conduction (Analytical Fourier Series)
// T(x,y) = (4*T1/pi) * sum_{k=0}^{kmax} exp(-(2k+1)*pi*y/L) * sin((2k+1)*pi*x/L) / (2k+1)
// Compile: g++ -O2 -std=c++17 week3_topic1_analytical2d.cpp -o topic1 && ./topic1

#include <cmath>
#include <cstdio>
#include <vector>

static const double PI = 3.14159265358979323846;

double temperature(double x, double y, int kmax, double T1 = 1.0, double L = 1.0) {
    double s = 0.0;
    for (int k = 0; k <= kmax; ++k) {
        int n = 2 * k + 1;
        s += std::exp(-n * PI * y / L) * std::sin(n * PI * x / L) / n;
    }
    return 4.0 * T1 / PI * s;
}

void heatFlux(double x, double y, int kmax, double& qx, double& qy,
              double T1 = 1.0, double L = 1.0, double kcond = 1.0) {
    double sx = 0.0, sy = 0.0;
    for (int k = 0; k <= kmax; ++k) {
        int n = 2 * k + 1;
        double e = std::exp(-n * PI * y / L);
        sx += (PI / L) * e * std::cos(n * PI * x / L);
        sy += -(PI / L) * e * std::sin(n * PI * x / L);
    }
    double pref = 4.0 * T1 / PI;
    qx = -kcond * pref * sx;
    qy = -kcond * pref * sy;
}

int main() {
    std::printf("Convergence at (x, y) = (0.5L, 0.5L):\n");
    for (int kmax : {0, 5, 10, 20, 30})
        std::printf("  kmax = %3d  ->  T/T1 = %.8f\n", kmax, temperature(0.5, 0.5, kmax));

    std::printf("\nSpot values (kmax = 30):\n");
    std::printf("  T/T1 at (0.25, 0.10) = %.6f\n", temperature(0.25, 0.10, 30));
    std::printf("  T/T1 at (0.50, 0.25) = %.6f\n", temperature(0.50, 0.25, 30));

    double qx, qy;
    heatFlux(0.5, 0.25, 30, qx, qy);
    std::printf("  flux/k at (0.50, 0.25): qx = %.6f, qy = %.6f, |q|/k = %.6f\n",
                qx, qy, std::hypot(qx, qy));

    std::printf("\nBC check: T(0, 0.5) = %.2e, T(L, 0.5) = %.2e, T(0.5, 0) = %.6f\n",
                temperature(0.0, 0.5, 30), temperature(1.0, 0.5, 30),
                temperature(0.5, 0.0, 30));
    return 0;
}
