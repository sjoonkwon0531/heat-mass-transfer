// Week 3 - Topic 3: Extended Surfaces (Fins), Uniform Cross-Section, Steady State
// d^2(Theta)/dx^2 - m^2 * Theta = 0,  Theta = T - Tinf,  m^2 = h*P/(k*Ac)
// Cases: (1) Dirichlet-Dirichlet, (2) adiabatic tip, (3) Robin (convective) tip
// Compile: g++ -O2 -std=c++17 week3_topic3_fin_analysis.cpp -o topic3 && ./topic3

#include <cmath>
#include <cstdio>
#include <cassert>

static const double PI = 3.14159265358979323846;

double thetaRatio(double x, double L, double m, int bcCase,
                  double thetaL_over_theta0 = 0.2, double h_over_mk = 0.5) {
    switch (bcCase) {
        case 1: {  // both ends Dirichlet
            double c = thetaL_over_theta0;
            double num = (c - std::exp(-m * L)) * (std::exp(m * x) - std::exp(-m * x));
            double den = std::exp(m * L) - std::exp(-m * L);
            return num / den + std::exp(-m * x);
        }
        case 2:    // adiabatic tip
            return std::cosh(m * (L - x)) / std::cosh(m * L);
        case 3: {  // Robin tip
            double B = h_over_mk;
            return (std::cosh(m * (L - x)) + B * std::sinh(m * (L - x))) /
                   (std::cosh(m * L) + B * std::sinh(m * L));
        }
    }
    return 0.0;
}

int main() {
    // Aluminum pin fin: D = 5 mm, L = 50 mm, k = 200 W/mK, h = 25 W/m^2K, Theta0 = 80 K
    double D = 0.005, L = 0.050, k = 200.0, h = 25.0, theta0 = 80.0;
    double P = PI * D, Ac = PI * D * D / 4.0;
    double m = std::sqrt(h * P / (k * Ac));
    double Qfin = std::sqrt(h * P * k * Ac) * theta0 * std::tanh(m * L);
    double eta = std::tanh(m * L) / (m * L);
    double eps = Qfin / (h * Ac * theta0);

    std::printf("Aluminum pin fin (D = 5 mm, L = 50 mm):\n");
    std::printf("  m = %.4f 1/m,  mL = %.4f\n", m, m * L);
    std::printf("  Q_fin = %.3f W,  eta = %.4f,  eps = %.2f\n", Qfin, eta, eps);

    double mL = 2.0, Lf = 1.0, mm = mL / Lf;
    std::printf("\nTheta/Theta0 profiles (mL = 2):\n");
    std::printf("  x/L     case1(D-D)  case2(adiab)  case3(Robin)\n");
    for (int i = 0; i <= 5; ++i) {
        double x = Lf * i / 5.0;
        std::printf("  %4.2f    %9.5f   %9.5f     %9.5f\n", x / Lf,
                    thetaRatio(x, Lf, mm, 1), thetaRatio(x, Lf, mm, 2),
                    thetaRatio(x, Lf, mm, 3));
    }

    assert(std::fabs(thetaRatio(0.0, Lf, mm, 2) - 1.0) < 1e-12);
    assert(std::fabs(thetaRatio(Lf, Lf, mm, 2) - 1.0 / std::cosh(mL)) < 1e-12);
    std::printf("\nCheck: 1/cosh(mL) = %.6f (matches adiabatic tip at x = L)\n",
                1.0 / std::cosh(mL));
    return 0;
}
