// Week 8 - Topic 1: Stirred-Tank Heating -> First-Order Process & FOPDT Fitting
// Energy balance: rho*V*cp dT'/dt = mdot*cp (Tin' - T') + Q'
//   -> T'(s) = [K/(tau s+1)] Q'(s) + [1/(tau s+1)] Tin'(s),
//      K = 1/(mdot*cp), tau = rho*V/mdot.
// FOPDT: G(s) = Kp exp(-theta_p s)/(tau_p s + 1).
// Two-point fit: tau_p = 3(t2-t1)/2, theta_p = (3 t1 - t2)/2
// Lecture example: t1 = 21.8 s, t2 = 36.0 s -> tau_p = 21.3 s, theta_p = 14.7 s.
// Build: g++ -O2 -std=c++17 week8_topic1_fopdt.cpp -o fopdt && ./fopdt

#include <cmath>
#include <cstdio>
#include <initializer_list>

double fopdt_step(double t, double Kp, double du,
                  double tau_p, double theta_p, double y0 = 0.0) {
    if (t < theta_p) return y0;
    double e = std::exp(-(t - theta_p) / tau_p);
    return e * y0 + (1.0 - e) * Kp * du;
}

int main() {
    // --- stirred tank: physical parameters -> K and tau ---
    const double rho = 1000.0, cp = 4184.0, V = 0.5, mdot = 0.25;
    const double K = 1.0 / (mdot * cp);
    const double tau = rho * V / mdot;
    std::printf("Stirred-tank first-order parameters:\n");
    std::printf("  K   = 1/(mdot*cp) = %.3e K/W\n", K);
    std::printf("  tau = rho*V/mdot  = %.1f s\n", tau);
    std::printf("  (a +10 kW step in Q raises T by %.3f K at steady state)\n\n", K * 1e4);

    // --- lecture two-point fit ---
    const double t1 = 21.8, t2 = 36.0;
    const double tau_p = 3.0 * (t2 - t1) / 2.0;
    const double theta_p = (3.0 * t1 - t2) / 2.0;
    std::printf("FOPDT two-point fit (lecture valve-to-temperature data):\n");
    std::printf("  t1 = %.1f s (0.283), t2 = %.1f s (0.632)\n", t1, t2);
    std::printf("  tau_p   = %.1f s (lecture 21.3)\n", tau_p);
    std::printf("  theta_p = %.1f s (lecture 14.7)\n", theta_p);
    for (double tt : {t1, t2})
        std::printf("  check y(%5.1f)/y_inf = %.4f\n", tt,
                    fopdt_step(tt, 1.0, 1.0, tau_p, theta_p));

    // --- normalized step-response table ---
    std::printf("\nNormalized FOPDT step response (Kp*du = 1):\n    t (s)    y(t)\n");
    for (int tt = 0; tt <= 120; tt += 10)
        std::printf("  %6d   %7.4f\n", tt,
                    fopdt_step(tt, 1.0, 1.0, tau_p, theta_p));
    std::printf("  -> 63.2%% reached at theta_p + tau_p = %.1f s\n", theta_p + tau_p);
    return 0;
}
