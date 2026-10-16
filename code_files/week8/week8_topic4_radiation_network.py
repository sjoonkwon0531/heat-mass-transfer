# Week 8 - Topic 4: View Factors & Gray-Surface Radiation Networks
# Lecture (Part 2):
#   * view factor F12 = fraction of energy leaving A1 that reaches A2;
#     reciprocity A1 F12 = A2 F21, summation sum_j Fij = 1 (closed enclosure)
#   * gray surface: radiosity J = rho G + eps Eb, surface resistance rho/(eps A),
#     geometric resistance 1/(A1 F12)
#   * n-surface system: (1 - Fii + eps_i/rho_i) J_i - sum_j J_j F_ij = (eps_i/rho_i) Eb_i
# Reproduces the lecture 3-surface example (T1 = 1100 K, T2 = 550 K, T3 = 0 K,
# A1 = 4 m^2):  black -> q1 = 328.3 kW;  gray (0.4/0.8/1) -> J1 = 33,900,
# J2 = 5,510 W/m^2, q1 = 131.2 kW.  (The lecture uses sigma = 5.676e-8, the
# classic Welty value; with the modern 5.670e-8 the answers shift by ~0.1%.)

import math

SIGMA_LECTURE = 5.676e-8    # classic (Welty) value used in the lecture example
SIGMA_MODERN = 5.670e-8


def f_parallel_rect(X, Y):
    """F12 for directly opposed parallel rectangles, X = a/c, Y = b/c."""
    x2, y2 = 1.0 + X * X, 1.0 + Y * Y
    s = math.log(math.sqrt(x2 * y2 / (1.0 + X * X + Y * Y)))
    s += X * math.sqrt(y2) * math.atan(X / math.sqrt(y2))
    s += Y * math.sqrt(x2) * math.atan(Y / math.sqrt(x2))
    s -= X * math.atan(X) + Y * math.atan(Y)
    return 2.0 / (math.pi * X * Y) * s


def f_coaxial_disks(r1, r2, D):
    """F12 for coaxial parallel disks separated by D."""
    R1, R2 = r1 / D, r2 / D
    X = 1.0 + (1.0 + R2 * R2) / (R1 * R1)
    return 0.5 * (X - math.sqrt(X * X - 4.0 * (r2 / r1) ** 2))


def solve3(J, A, F, eps, Eb):
    """Gauss-Seidel solve of the 3-surface radiosity system (eps<1 surfaces)."""
    for _ in range(500):
        for i in range(3):
            rho = 1.0 - eps[i]
            if rho < 1e-12:                       # black: J = Eb
                J[i] = Eb[i]
                continue
            c = eps[i] / rho
            s = sum(F[i][j] * J[j] for j in range(3) if j != i)
            J[i] = (c * Eb[i] + s) / (1.0 - F[i][i] + c)
    return J


if __name__ == "__main__":
    # --- view-factor sanity checks against the lecture charts ---
    print("View factors:")
    print(f"  squares, side/distance = 1: F12 = {f_parallel_rect(1,1):.4f} (chart ~0.20)")
    print(f"  squares, side/distance = 2: F12 = {f_parallel_rect(2,2):.4f} (chart ~0.41)")
    print(f"  equal disks, r/D = 1      : F12 = {f_coaxial_disks(1,1,1):.4f} (chart ~0.38)")
    print(f"  hemisphere over its base  : F12 = A2/A1 = 1/2 (reciprocity, lecture)")
    print(f"  concentric spheres r1<r2  : F12 = 1, F21 = (r1/r2)^2, F22 = 1-(r1/r2)^2")

    # --- lecture 3-surface example ---
    sig = SIGMA_LECTURE
    T = [1100.0, 550.0, 0.0]
    Eb = [sig * Ti ** 4 for Ti in T]
    F = [[0.0, 0.2, 0.3], [0.2, 0.0, 0.8], [0.2, 0.2, 0.6]]
    A1 = 4.0
    print(f"\n3-surface enclosure (lecture): Eb1 = {Eb[0]:.0f}, Eb2 = {Eb[1]:.0f} W/m^2")

    # (a) all black
    q1 = A1 * (Eb[0] - F[0][1] * Eb[1] - F[0][2] * Eb[2])
    print(f"  (a) all black:   q1 = A1(Eb1 - F12 Eb2 - F13 Eb3) = {q1/1e3:.1f} kW "
          "(lecture 328.3)")

    # (b) surfaces 1,2 black, surface 3 re-radiating (q3 = 0)
    J3 = (Eb[0] * F[2][0] + Eb[1] * F[2][1]) / (1.0 - F[2][2])
    q1b = A1 * (Eb[0] - F[0][1] * Eb[1] - F[0][2] * J3)
    q2b = A1 * (Eb[1] - F[1][0] * Eb[0] - F[1][2] * J3)   # A2 = A1 here
    print(f"  (b) 3 re-radiating: J3 = {J3:.0f} W/m^2, q1 = {q1b/1e3:.1f} kW, "
          f"q2 = {q2b/1e3:.1f} kW")
    print("      -> surface 2 receives |q2| = "
          f"{abs(q2b)/1e3:.1f} kW (the lecture's 187.0 kW figure)")

    # (c) gray: eps = (0.4, 0.8, 1.0)
    eps = [0.4, 0.8, 1.0]
    J = solve3([Eb[0], Eb[1], Eb[2]], A1, F, eps, Eb)
    q1c = A1 * eps[0] / (1 - eps[0]) * (Eb[0] - J[0])
    print(f"  (c) gray (0.4/0.8/1): J1 = {J[0]:.0f} (lecture 33,900), "
          f"J2 = {J[1]:.0f} (lecture 5,510) W/m^2")
    print(f"      q1 = A1 eps1/rho1 (Eb1 - J1) = {q1c/1e3:.1f} kW (lecture 131.2)")
    print(f"      (identical to A1[J1 - F12 J2 - F13 J3] = "
          f"{A1*(J[0]-F[0][1]*J[1]-F[0][2]*J[2])/1e3:.1f} kW)")

    # --- radiation heat-transfer coefficient ---
    T1, T2 = 400.0, 300.0
    sig = SIGMA_MODERN
    hr = 4.0 * sig * T1 ** 3                      # F12 = 1 limit, linearized at T1
    q_exact = sig * (T1 ** 4 - T2 ** 4)
    q_lin = hr * (T1 - T2)
    print(f"\nRadiation coefficient h_r = 4 F12 sigma T1^3 (linearization):")
    print(f"  T1 = {T1:.0f} K, T2 = {T2:.0f} K: h_r = {hr:.2f} W/m^2 K")
    print(f"  exact sigma(T1^4-T2^4) = {q_exact:.0f} W/m^2 vs h_r dT = {q_lin:.0f} W/m^2")
    print("  -> the tangent-line estimate overshoots for large dT; "
          "good only for T1 - T2 << T1.")
