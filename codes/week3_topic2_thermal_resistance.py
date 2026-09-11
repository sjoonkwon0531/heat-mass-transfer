# Week 3 - Topic 2: Combined Conduction + Convection via Thermal Resistance Networks
# Series electrical-circuit analogy:
#   Q = dT / sum(R_i),  R_conv = 1/(h*A),  R_cond(slab) = L/(k*A),
#   R_cond(cylinder) = ln(r_o/r_i) / (2*pi*L*k)
# Case A: 3-layer plane wall with convection on both sides (slide example geometry).
# Case B: insulated pipe (inner convection + wall conduction + insulation + outer convection).

import math

def plane_wall(Th, Tc, A, hL, hR, layers):
    """layers: list of (thickness L_i, conductivity k_i). Returns Q, U, interface temps."""
    R = [1.0 / (hL * A)] + [L / (k * A) for (L, k) in layers] + [1.0 / (hR * A)]
    Rtot = sum(R)
    Q = (Th - Tc) / Rtot
    U = 1.0 / (A * Rtot)
    # March temperatures across each resistance
    temps = [Th]
    for Ri in R:
        temps.append(temps[-1] - Q * Ri)
    return Q, U, R, temps

def insulated_pipe(Th, Tc, Lpipe, r, k, h_in, h_out):
    """r: list of radii [r_i, r1, ..., r_o]; k: list of conductivities per shell."""
    A_in = 2.0 * math.pi * r[0] * Lpipe
    A_out = 2.0 * math.pi * r[-1] * Lpipe
    R = [1.0 / (h_in * A_in)]
    for i, ki in enumerate(k):
        R.append(math.log(r[i + 1] / r[i]) / (2.0 * math.pi * Lpipe * ki))
    R.append(1.0 / (h_out * A_out))
    Rtot = sum(R)
    Q = (Th - Tc) / Rtot
    return Q, R

if __name__ == "__main__":
    # --- Case A: hot air | layer1 | layer2 | layer3 | cold air ---
    Th, Tc, A = 300.0, 20.0, 1.0            # degC, degC, m^2
    hL, hR = 25.0, 10.0                      # W/m^2K
    layers = [(0.02, 15.0), (0.10, 0.5), (0.01, 45.0)]  # (m, W/mK): steel|insulation|steel
    Q, U, R, temps = plane_wall(Th, Tc, A, hL, hR, layers)
    names = ["conv,L", "cond,1", "cond,2", "cond,3", "conv,R"]
    print("Case A: 3-layer plane wall with two-sided convection")
    for n, Ri in zip(names, R):
        print(f"  R_{n:<7s} = {Ri:10.6f} K/W")
    print(f"  R_total   = {sum(R):10.6f} K/W")
    print(f"  Q  = {Q:.3f} W,  U = {U:.4f} W/m^2K")
    print("  T profile (Th, T1..T4, Tc):", ", ".join(f"{t:.2f}" for t in temps))

    # --- Case B: steam pipe with insulation ---
    # steel pipe r_i=25mm, r1=30mm (k=50); insulation to r_o=55mm (k=0.06)
    Q2, R2 = insulated_pipe(Th=250.0, Tc=25.0, Lpipe=1.0,
                            r=[0.025, 0.030, 0.055], k=[50.0, 0.06],
                            h_in=1500.0, h_out=12.0)
    print("\nCase B: insulated steam pipe, per meter of pipe")
    labels = ["conv,in", "cond,steel", "cond,insul", "conv,out"]
    for n, Ri in zip(labels, R2):
        print(f"  R_{n:<10s} = {Ri:10.6f} K/W")
    print(f"  Q per meter = {Q2:.2f} W/m")
