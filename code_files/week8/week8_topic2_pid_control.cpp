// Week 8 - Topic 2: PID Feedback & Feedforward Control of a Heat Exchanger
// Plant (valve -> tank temperature), FOPDT: G = exp(-14.7 s)/(21.3 s + 1)
// Disturbance (inflow temperature):       Gd = exp(-35 s)/(25 s + 1)
// ITAE PI tuning: Kc = 0.859 (th/ta)^-0.977 = 1.2341,
//                 tau_I = ta/0.674 (th/ta)^0.680 = 24.5582
// Reproduces: setpoint overshoot ~1.26 near t~46 s; disturbance peak 0.53 (FB)
// vs 0.17 (static FF + FB, the MATLAB 'heatex' demo configuration).
// Build: g++ -O2 -std=c++17 week8_topic2_pid_control.cpp -o pid && ./pid

#include <cmath>
#include <cstdio>
#include <vector>
#include <algorithm>
#include <string>

std::vector<double> closed_loop(double Kc, double tau_I, double tau_D,
                                double T_end, double setpoint, double disturb,
                                const std::string& ff) {
    const double tau_p = 21.3, theta_p = 14.7, Kp = 1.0;
    const double tau_d = 25.0, theta_d = 35.0;
    const double dt = 0.01;
    const int n = static_cast<int>(T_end / dt);
    const int dp = static_cast<int>(theta_p / dt);
    const int dd = static_cast<int>(theta_d / dt);
    const int dst = static_cast<int>(25.0 / dt);
    const int dll = static_cast<int>((theta_d - theta_p) / dt);
    std::vector<double> ubuf(n + dp + 1, 0.0), dbuf(n + dd + 1, 0.0);
    std::vector<double> fbuf(n + std::max(dst, dll) + 1, 0.0);
    double xff = 0, yp = 0, yd = 0, y = 0, I = 0, e_prev = setpoint;
    std::vector<double> ys(n);
    for (int k = 0; k < n; ++k) {
        double e = setpoint - y;
        I += e * dt;
        double u = Kc * (e + I / tau_I + tau_D * (e - e_prev) / dt);
        e_prev = e;
        if (ff == "static") {
            fbuf[k + dst] = -disturb;
            u += fbuf[k];
        } else if (ff == "leadlag") {
            xff += dt * (disturb - xff) / tau_d;
            fbuf[k + dll] = -(tau_p * (disturb - xff) / tau_d + xff);
            u += fbuf[k];
        }
        ubuf[k + dp] = u;
        dbuf[k + dd] = disturb;
        yp += dt * (-yp + Kp * ubuf[k]) / tau_p;
        yd += dt * (-yd + dbuf[k]) / tau_d;
        y = yp + yd;
        ys[k] = y;
    }
    return ys;
}

double max_abs(const std::vector<double>& v) {
    double m = 0;
    for (double x : v) m = std::max(m, std::fabs(x));
    return m;
}

int main() {
    const double tau_p = 21.3, theta_p = 14.7;
    const double r = theta_p / tau_p;
    const double Kc = 0.859 * std::pow(r, -0.977);
    const double tau_I = tau_p / 0.674 * std::pow(r, 0.680);
    std::printf("ITAE PI tuning for G = exp(-14.7 s)/(21.3 s + 1):\n");
    std::printf("  Kc = %.4f (lecture 1.2341), tau_I = %.4f (lecture 24.5582)\n\n",
                Kc, tau_I);

    auto ys = closed_loop(Kc, tau_I, 0, 250, 1, 0, "none");
    int im = static_cast<int>(std::max_element(ys.begin(), ys.end()) - ys.begin());
    std::printf("Setpoint step (PI): peak y = %.3f at t = %.0f s (lecture ~1.26 @ 46 s)\n",
                ys[im], im * 0.01);
    std::printf("  final y = %.4f -> no offset (integral action)\n\n", ys.back());

    for (double KcP : {0.5, 1.0, 2.0}) {
        auto yp = closed_loop(KcP, 1e12, 0, 600, 1, 0, "none");
        std::printf("  P-only Kc = %.1f: y_ss = %.3f, offset = %.3f (theory %.3f)\n",
                    KcP, yp.back(), 1 - yp.back(), 1 / (1 + KcP));
    }
    std::printf("  -> dead time caps the gain: ultimate Kc ~ 2.9 here\n\n");

    auto yfb = closed_loop(Kc, tau_I, 0, 250, 0, 1, "none");
    auto yst = closed_loop(Kc, tau_I, 0, 250, 0, 1, "static");
    auto yll = closed_loop(Kc, tau_I, 0, 250, 0, 1, "leadlag");
    std::printf("Unit disturbance step (setpoint = 0):\n");
    std::printf("  feedback only          : max|y| = %.3f (lecture ~0.53)\n", max_abs(yfb));
    std::printf("  static FF + FB (heatex): max|y| = %.3f (lecture ~0.17)\n", max_abs(yst));
    std::printf("  exact -Gd/G FF + FB    : max|y| = %.3f\n", max_abs(yll));
    return 0;
}
