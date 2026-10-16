// Week 8 - Topic 4: View Factors & Gray-Surface Radiation Networks
// View factor F12: fraction of energy leaving A1 that reaches A2;
// reciprocity A1 F12 = A2 F21; summation sum_j Fij = 1 (closed enclosure).
// Gray surface: radiosity J = rho G + eps Eb; resistances rho/(eps A), 1/(A F12).
// n-surface system: (1 - Fii + eps_i/rho_i) J_i - sum_j J_j F_ij = (eps_i/rho_i) Eb_i
// Reproduces the lecture 3-surface example (sigma = 5.676e-8, classic value):
// black -> q1 = 328.3 kW; gray (0.4/0.8/1) -> J1 = 33,900, J2 = 5,510, q1 = 131.2 kW.
// Build: g++ -O2 -std=c++17 week8_topic4_radiation_network.cpp -o radnet && ./radnet

#include <cmath>
#include <cstdio>
#include <array>

const double SIGMA_LECTURE = 5.676e-8;
const double SIGMA_MODERN = 5.670e-8;

// directly opposed parallel rectangles, X = a/c, Y = b/c
double f_rect(double X, double Y) {
    double x2 = 1 + X * X, y2 = 1 + Y * Y;
    double s = std::log(std::sqrt(x2 * y2 / (1 + X * X + Y * Y)));
    s += X * std::sqrt(y2) * std::atan(X / std::sqrt(y2));
    s += Y * std::sqrt(x2) * std::atan(Y / std::sqrt(x2));
    s -= X * std::atan(X) + Y * std::atan(Y);
    return 2.0 / (M_PI * X * Y) * s;
}

double f_disks(double r1, double r2, double D) {
    double R1 = r1 / D, R2 = r2 / D;
    double X = 1 + (1 + R2 * R2) / (R1 * R1);
    return 0.5 * (X - std::sqrt(X * X - 4 * (r2 / r1) * (r2 / r1)));
}

int main() {
    std::printf("View factors:\n");
    std::printf("  squares side/dist = 1: F12 = %.4f (chart ~0.20)\n", f_rect(1, 1));
    std::printf("  squares side/dist = 2: F12 = %.4f (chart ~0.41)\n", f_rect(2, 2));
    std::printf("  equal disks r/D = 1  : F12 = %.4f (chart ~0.38)\n", f_disks(1, 1, 1));
    std::printf("  hemisphere over base : F12 = 1/2 (reciprocity)\n");
    std::printf("  concentric spheres   : F12 = 1, F21 = (r1/r2)^2\n\n");

    // --- lecture 3-surface example ---
    double sig = SIGMA_LECTURE;
    std::array<double, 3> T = {1100.0, 550.0, 0.0};
    std::array<double, 3> Eb;
    for (int i = 0; i < 3; ++i) Eb[i] = sig * std::pow(T[i], 4);
    double F[3][3] = {{0.0, 0.2, 0.3}, {0.2, 0.0, 0.8}, {0.2, 0.2, 0.6}};
    const double A1 = 4.0;
    std::printf("3-surface enclosure: Eb1 = %.0f, Eb2 = %.0f W/m^2\n", Eb[0], Eb[1]);

    // (a) all black
    double q1 = A1 * (Eb[0] - F[0][1] * Eb[1] - F[0][2] * Eb[2]);
    std::printf("  (a) all black: q1 = %.1f kW (lecture 328.3)\n", q1 / 1e3);

    // (b) surfaces 1,2 black, surface 3 re-radiating (q3 = 0)
    double J3 = (Eb[0] * F[2][0] + Eb[1] * F[2][1]) / (1.0 - F[2][2]);
    double q1b = A1 * (Eb[0] - F[0][1] * Eb[1] - F[0][2] * J3);
    double q2b = A1 * (Eb[1] - F[1][0] * Eb[0] - F[1][2] * J3);
    std::printf("  (b) 3 re-radiating: J3 = %.0f, q1 = %.1f kW, |q2| = %.1f kW "
                "(lecture 187.0)\n", J3, q1b / 1e3, std::fabs(q2b) / 1e3);

    // (c) gray: eps = (0.4, 0.8, 1.0) -> Gauss-Seidel
    std::array<double, 3> eps = {0.4, 0.8, 1.0};
    std::array<double, 3> J = Eb;
    for (int it = 0; it < 500; ++it) {
        for (int i = 0; i < 3; ++i) {
            double rho = 1.0 - eps[i];
            if (rho < 1e-12) { J[i] = Eb[i]; continue; }
            double c = eps[i] / rho;
            double s = 0.0;
            for (int j = 0; j < 3; ++j) if (j != i) s += F[i][j] * J[j];
            J[i] = (c * Eb[i] + s) / (1.0 - F[i][i] + c);
        }
    }
    double q1c = A1 * eps[0] / (1.0 - eps[0]) * (Eb[0] - J[0]);
    std::printf("  (c) gray (0.4/0.8/1): J1 = %.0f (lect 33,900), J2 = %.0f "
                "(lect 5,510)\n", J[0], J[1]);
    std::printf("      q1 = %.1f kW (lecture 131.2)\n\n", q1c / 1e3);

    // --- radiation heat-transfer coefficient ---
    double T1 = 400.0, T2 = 300.0;
    sig = SIGMA_MODERN;
    double hr = 4.0 * sig * std::pow(T1, 3);
    std::printf("h_r = 4 sigma T1^3 = %.2f W/m^2 K (T1 = 400 K)\n", hr);
    std::printf("exact sigma(T1^4-T2^4) = %.0f vs h_r dT = %.0f W/m^2\n",
                sig * (std::pow(T1, 4) - std::pow(T2, 4)), hr * (T1 - T2));
    std::printf("-> linearization good only for T1 - T2 << T1\n");
    return 0;
}
