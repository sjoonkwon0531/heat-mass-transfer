// Week 5 - Topic 1: Blasius Boundary Layer by the Shooting Method
// f*f'' + 2*f''' = 0,  f(0) = f'(0) = 0,  f'(inf) = 1
// Shooting + secant on f''(0). Results: f''(0) = 0.332057, beta = 1.720787,
// delta_99 ~ 5.0*x/sqrt(Re_x), local c_f = 0.664/sqrt(Re_x).
// Compile: g++ -O2 -std=c++17 week5_topic1_blasius_shooting.cpp -o topic1 && ./topic1

#include <cmath>
#include <cstdio>
#include <vector>
#include <array>
#include <cassert>
#include <initializer_list>

using State = std::array<double, 3>;   // [f, f', f'']

static State rhs(const State& y) {
    return {y[1], y[2], -0.5 * y[0] * y[2]};
}

static State step(const State& y, double dz) {
    State k1 = rhs(y), y2, y3, y4;
    for (int j = 0; j < 3; ++j) y2[j] = y[j] + dz / 2 * k1[j];
    State k2 = rhs(y2);
    for (int j = 0; j < 3; ++j) y3[j] = y[j] + dz / 2 * k2[j];
    State k3 = rhs(y3);
    for (int j = 0; j < 3; ++j) y4[j] = y[j] + dz * k3[j];
    State k4 = rhs(y4);
    State out;
    for (int j = 0; j < 3; ++j)
        out[j] = y[j] + dz / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
    return out;
}

static std::vector<std::pair<double, State>> integrate(double fpp0,
        double zmax = 10.0, double dz = 0.001) {
    std::vector<std::pair<double, State>> path;
    State y = {0.0, 0.0, fpp0};
    path.push_back({0.0, y});
    int n = static_cast<int>(zmax / dz);
    for (int i = 0; i < n; ++i) {
        y = step(y, dz);
        path.push_back({(i + 1) * dz, y});
    }
    return path;
}

int main() {
    // secant iteration on g(fpp0) = f'(zmax) - 1
    double a = 0.2, b = 0.5;
    double ga = integrate(a).back().second[1] - 1.0;
    double gb = integrate(b).back().second[1] - 1.0;
    for (int it = 0; it < 40; ++it) {
        double c = b - gb * (b - a) / (gb - ga);
        double gc = integrate(c).back().second[1] - 1.0;
        a = b; ga = gb; b = c; gb = gc;
        if (std::fabs(gc) < 1e-12) break;
    }
    double fpp0 = b;
    std::printf("Shooting result: f''(0) = %.6f   (lecture: 0.332057)\n", fpp0);

    auto path = integrate(fpp0);
    double z99 = 0.0;
    for (auto& p : path) if (p.second[1] >= 0.99) { z99 = p.first; break; }
    std::printf("f' = 0.99 at zeta = %.2f  ->  delta_99 ~ %.1f * x / sqrt(Re_x)\n", z99, z99);
    double beta = path.back().first - path.back().second[0];
    std::printf("beta = lim(zeta - f) = %.6f   (lecture: 1.720787)\n", beta);

    std::printf("\nProfile:\n  zeta    f        f'       f''\n");
    for (double zt : {0.0, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 8.0}) {
        auto& p = path[static_cast<size_t>(zt / 0.001)];
        std::printf("  %4.1f  %7.4f  %7.4f  %7.4f\n",
                    p.first, p.second[0], p.second[1], p.second[2]);
    }

    std::printf("\nDrag: 2*f''(0) = %.4f (the 0.664 prefactor), overall C_f = 1.328/sqrt(Re_L)\n",
                2 * fpp0);
    double nu = 15.9e-6, U = 5.0, L = 0.5;
    std::printf("\nWorked example: air, U = %.0f m/s, L = %.1f m -> Re_L = %.3e (laminar)\n",
                U, L, U * L / nu);
    for (double x : {0.05, 0.1, 0.25, 0.5}) {
        double Rex = U * x / nu;
        std::printf("  x = %4.2f m: Re_x = %9.3e, delta_99 = %5.2f mm, c_f = %.5f\n",
                    x, Rex, 5.0 * x / std::sqrt(Rex) * 1e3, 0.664 / std::sqrt(Rex));
    }

    assert(std::fabs(fpp0 - 0.332057) < 1e-4);
    assert(std::fabs(beta - 1.720787) < 1e-4);
    return 0;
}
