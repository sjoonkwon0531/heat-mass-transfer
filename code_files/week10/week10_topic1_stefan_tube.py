# Week 10 - Topic 1: Stefan Tube (Arnold Cell), Log-Mean, Film Model, Pseudo-Steady D Measurement
# Lecture (Part 1):
#   * steady 1D diffusion of A through stagnant B (N_Bz = 0):
#       N_Az = -cD_AB/(1 - y_A) dy_A/dz = const
#       N_Az = cD_AB/(z2 - z1) ln[(1 - y_A2)/(1 - y_A1)] = cD_AB (y_A1 - y_A2)/((z2 - z1) y_B,lm)
#       y_B,lm = (y_B2 - y_B1)/ln(y_B2/y_B1)
#   * profile: (1 - y_A)/(1 - y_A1) = [(1 - y_A2)/(1 - y_A1)]^((z - z1)/(z2 - z1))
#   * film model: k_c = P D_AB/(delta p_B,lm)
#   * pseudo-steady Arnold cell (liquid level falls slowly):
#       rho_AL/M_A dz/dt = cD_AB (y_A1 - y_A2)/(z y_B,lm)
#       -> t = rho_AL y_B,lm (z^2 - z0^2)/(2 c D_AB M_A (y_A1 - y_A2))
#       -> D_AB from the slope of (z^2 - z0^2) versus t.

import math
import random

R = 8.314462618

# Antoine constants (log10 P[mmHg] = A - B/(C + T[degC]))
ANTOINE = {"water": (8.07131, 1730.63, 233.426),
           "ethanol": (8.20417, 1642.89, 230.300),
           "acetone": (7.02447, 1161.0, 224.0)}
# liquid density (kg/m^3) and molar mass (g/mol) near 25 degC
LIQ = {"water": (997.0, 18.015), "ethanol": (789.0, 46.07), "acetone": (784.0, 58.08)}
# Fuller diffusion volumes from the Week 9 lecture table (C 16.5, H 1.98, O 5.48; H2O 12.7; air 20.1)
VOL = {"water": 12.7, "ethanol": 2 * 16.5 + 6 * 1.98 + 5.48, "acetone": 3 * 16.5 + 6 * 1.98 + 5.48, "air": 20.1}


def psat(liq, T_C):
    A, B, C = ANTOINE[liq]
    return 10 ** (A - B / (C + T_C)) * 133.322   # Pa


def fuller(liq, T_K, P_atm=1.0):
    Ma, Mb = LIQ[liq][1], 28.97
    den = (VOL[liq] ** (1 / 3) + VOL["air"] ** (1 / 3)) ** 2
    return 1.011e-3 * T_K ** 1.75 * math.sqrt(1 / Ma + 1 / Mb) / (P_atm * den) * 1e-4   # m^2/s


def ylm(yA1, yA2):
    yB1, yB2 = 1 - yA1, 1 - yA2
    return (yB2 - yB1) / math.log(yB2 / yB1) if abs(yB2 - yB1) > 1e-12 else yB1


def stefan_flux(c, D, L, yA1, yA2):
    return c * D / L * math.log((1 - yA2) / (1 - yA1))


def profile(z, L, yA1, yA2):
    return 1 - (1 - yA1) * ((1 - yA2) / (1 - yA1)) ** (z / L)


if __name__ == "__main__":
    P, T_C = 101325.0, 25.0
    T = T_C + 273.15
    c = P / (R * T)
    L = 0.10                                   # 10 cm tube
    print(f"Stefan tube, L = {L*100:.0f} cm, {T_C} C, 1 atm, c = {c:.3f} mol/m^3")
    print(" liquid    p_sat(kPa)  y_A1    D(cm^2/s)  y_B,lm   N_A (mol/m^2 s)  Stefan/Fick")
    for liq in ("water", "ethanol", "acetone"):
        yA1 = psat(liq, T_C) / P
        D = fuller(liq, T)
        N = stefan_flux(c, D, L, yA1, 0.0)
        N_fick = c * D * yA1 / L
        print(f" {liq:<8} {psat(liq,T_C)/1e3:9.2f}  {yA1:6.4f}  {D*1e4:8.4f}  {ylm(yA1,0):7.4f}  {N:14.4e}  {N/N_fick:9.4f}")

    # check the two equivalent forms and the profile
    yA1 = psat("acetone", T_C) / P
    D = fuller("acetone", T)
    N1 = stefan_flux(c, D, L, yA1, 0.0)
    N2 = c * D * (yA1 - 0.0) / (L * ylm(yA1, 0.0))
    print(f"\nlog form {N1:.6e} vs log-mean form {N2:.6e}")
    zs = [i * L / 1000 for i in range(1001)]
    yB = [1 - profile(z, L, yA1, 0.0) for z in zs]
    mean = sum((yB[i] + yB[i + 1]) / 2 for i in range(1000)) / 1000
    print(f"path-averaged y_B = {mean:.6f} equals y_B,lm = {ylm(yA1, 0.0):.6f}")

    # film model k_c
    delta = 2e-3
    kc = P * D / (delta * ylm(yA1, 0.0) * P)
    print(f"film model (delta = 2 mm): k_c = P D/(delta p_B,lm) = {kc*100:.3f} cm/s")

    # pseudo-steady Arnold cell: synthetic experiment and back-calculation of D
    liq = "water"
    rhoL, MA = LIQ[liq]
    yA1 = psat(liq, T_C) / P
    D_true = fuller(liq, T)
    z0 = 0.02
    K = 2 * c * D_true * MA * 1e-3 * yA1 / (rhoL * ylm(yA1, 0.0))   # z^2 - z0^2 = K t
    random.seed(3)
    days = [1, 2, 4, 6, 8, 10, 14]
    data = []
    for d in days:
        t = d * 86400
        z = math.sqrt(z0 ** 2 + K * t) + random.gauss(0, 2e-5)      # +-20 um reading noise
        data.append((t, z))
    xs = [t for t, _ in data]
    ys = [z * z - z0 * z0 for _, z in data]
    slope = sum(x * y for x, y in zip(xs, ys)) / sum(x * x for x in xs)  # fit through origin
    D_fit = slope * rhoL * ylm(yA1, 0.0) / (2 * c * MA * 1e-3 * yA1)
    print(f"\nArnold cell (water, z0 = 2 cm): level after 14 days z = {data[-1][1]*100:.3f} cm")
    print(f"D_true = {D_true*1e4:.4f} cm^2/s, D from (z^2 - z0^2) vs t fit = {D_fit*1e4:.4f} cm^2/s")
