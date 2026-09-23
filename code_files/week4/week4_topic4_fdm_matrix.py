# Week 4 - Topic 4: Explicit FDM in Matrix Form - U_{n+1} = D*U_n + dtau*q_n
# Dimensionless 1-D heat equation with an internal source (lecture Part 2):
#   dU/dtau = d^2U/dr^2 + q(r,tau),  U(0)=U(1)=0,  U(r,0)=0
# Forward-time / central-space discretization assembled as one matrix update:
#   U_{n+1} = D*U_n + dtau*q_n,  D tridiagonal with 1-2s on the diagonal,
#   s = dtau/dr^2  (stability requires s <= 1/2)
# Reproduces the lecture MATLAB demo: dr = 0.01, dtau = dr^2/4 (s = 1/4),
# q = 100 on 0.45 <= r <= 0.55, tau up to 0.1, T0 = 25 degC
#   -> U_max = 1.7786, T_max = T0*U_max = 44.46 degC (lecture value)

import numpy as np

def build_D(m, s):
    """(m+1)x(m+1) update matrix, lecture form (boundary rows included)."""
    D = np.zeros((m + 1, m + 1))
    for i in range(1, m):
        D[i, i] = 1.0 - 2.0 * s
        D[i, i + 1] = s
        D[i, i - 1] = s
    D[0, 0] = D[m, m] = 1.0 - 2.0 * s
    D[0, 1] = D[1, 0] = D[m, m - 1] = D[m - 1, m] = s
    return D

def run_fdm(delr=0.01, s=0.25, tau_end=0.1, q0=100.0, band=(0.45, 0.55), eta=0.0):
    """March U_{n+1} = D U_n + dtau q_n. eta > 0 gives a decaying source q*exp(-eta*tau)."""
    delt = s * delr**2
    rvec = np.arange(0.0, 1.0 + delr / 2, delr)
    m = len(rvec) - 1
    nsteps = int(round(tau_end / delt))
    qvec = np.where((rvec >= band[0]) & (rvec <= band[1]), q0, 0.0)
    D = build_D(m, s)
    U = np.zeros(m + 1)
    Umax, tau = 0.0, 0.0
    for kstep in range(nsteps):
        q = qvec * np.exp(-eta * tau) if eta > 0.0 else qvec
        U = D @ U + delt * q
        tau += delt
        Umax = max(Umax, U.max())
    return rvec, U, Umax

if __name__ == "__main__":
    # --- Lecture demo: steady source band at the center ---
    rvec, U, Umax = run_fdm()
    T0 = 25.0
    print("Lecture demo: dr = 0.01, dtau = dr^2/4, q = 100 on [0.45, 0.55], tau <= 0.1")
    print(f"  U_max = {Umax:.4f}")
    print(f"  T_max = T0 * U_max = {T0 * Umax:.2f} degC   (lecture: 44.46 degC)")
    iC = len(rvec) // 2
    print(f"  final profile: U(0.25) = {U[len(rvec)//4]:.4f},  U(0.5) = {U[iC]:.4f},  "
          f"U(0.75) = {U[3*len(rvec)//4]:.4f}")

    # --- Decaying source, q*exp(-tau), lecture's time-dependent variant ---
    _, _, Umax_d = run_fdm(eta=1.0)
    print(f"\nDecaying source q*exp(-tau): U_max = {Umax_d:.4f} "
          f"(T_max = {T0*Umax_d:.2f} degC)")

    # --- Stability experiment: push s past 1/2 ---
    print("\nStability of the explicit scheme (s = dtau/dr^2):")
    for s in (0.25, 0.50, 0.51, 0.60):
        _, Uend, _ = run_fdm(delr=0.02, s=s, tau_end=0.1)
        finite = np.isfinite(Uend).all()
        note = "stable" if (finite and np.abs(Uend).max() < 10) else "UNSTABLE (oscillates/diverges)"
        print(f"  s = {s:4.2f}: max|U| at tau=0.1 -> {np.abs(Uend).max():10.3e}  {note}")
    print("  -> s <= 1/2: each node moves toward its neighbors' mean; beyond that it overshoots.")

    # sanity: symmetric problem must give a symmetric field
    assert np.abs(U - U[::-1]).max() < 1e-12
