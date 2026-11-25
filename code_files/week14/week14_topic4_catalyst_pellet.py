"""
Week 14 · Topic 4 — Mass transfer for reaction engineering: external film, packed bed, Thiele modulus
Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)

  External film (Froessling form used in the lecture): Sh = 2 + 0.6 Re^(1/2) Sc^(1/3),  k_c = Sh D_AB / d_p
  Surface reaction in series with the film:  c_As = k_c c_Ab/(k_r + k_c),  r'' = k_r k_c c_Ab/(k_r + k_c)
  Mass-transfer-limited packed bed:  c_A/c_A0 = exp(-k_c a_c z / U),  a_c = 6(1 - phi)/d_p
  First-order reaction in a spherical pellet (Thiele modulus phi1 = R sqrt(rho_c S_a k1 / D_e)):
      C(r~) = sinh(phi1 r~)/(r~ sinh phi1),   eta = (3/phi1^2)(phi1 coth phi1 - 1)
  Overall effectiveness with the external film (bed basis, k = rho_b S_a k1):
      Omega = eta / (1 + eta k / (k_c a_c))
"""
import math


def froessling(U, dp, D, nu, a=0.6):
    Re, Sc = U * dp / nu, nu / D
    Sh = 2 + a * Re ** 0.5 * Sc ** (1 / 3)
    return Re, Sc, Sh, Sh * D / dp


def eta_sphere(phi):
    if phi < 1e-4:
        return 1.0
    return 3.0 / phi ** 2 * (phi / math.tanh(phi) - 1.0)


def main():
    print("Topic 4 — external film, packed bed, and internal diffusion\n")
    print("[1] Lecture example: d_p = 1 cm, U = 0.1 m/s, D_AB = 1e-10 m2/s, nu = 5e-7 m2/s, c_Ab = 1 mol/L")
    Re, Sc, Sh, kc = froessling(0.1, 0.01, 1e-10, 5e-7)
    print(f"   Re = {Re:.0f}, Sc = {Sc:.0f}, Sh = {Sh:.1f}, k_c = {kc:.3e} m/s")
    print(f"   instantaneous surface reaction: n_A = k_c c_Ab = {kc * 1000:.3e} mol/(m2 s)\n")

    print("[2] Finite surface rate: Da = k_r/k_c")
    for Da in (0.01, 0.1, 1, 10, 100):
        kr = Da * kc
        cAs = kc / (kr + kc)
        r = kr * kc / (kr + kc) * 1000
        print(f"   Da = {Da:7.2f}   c_As/c_Ab = {cAs:.4f}   rate = {r:.3e} mol/(m2 s)")
    print("   (Da << 1: reaction-limited; Da >> 1: transport-limited.)\n")

    print("[3] Sensitivity of k_c in the transport-limited regime (Sh >> 2): k_c ∝ U^(1/2) d_p^(-1/2) D^(2/3) nu^(-1/6)")
    for U in (0.05, 0.1, 0.2, 0.4):
        print(f"   U = {U:.2f} m/s   k_c = {froessling(U, 0.01, 1e-10, 5e-7)[3]:.3e} m/s")
    print()

    print("[4] Mass-transfer-limited packed bed (d_p = 1 cm, bed porosity 0.4, U = 0.1 m/s superficial)")
    ac = 6 * (1 - 0.4) / 0.01
    for z in (0.1, 0.5, 1.0, 2.0, 5.0):
        print(f"   z = {z:4.1f} m   c_A/c_A0 = {math.exp(-kc * ac * z / 0.1):.4f}   conversion = {1 - math.exp(-kc * ac * z / 0.1):.4f}")
    print(f"   a_c = {ac:.0f} m2/m3\n")

    print("[5] Internal effectiveness factor of a sphere")
    print("      phi1      eta        3/phi1")
    for phi in (0.1, 0.5, 1, 2, 5, 10, 20):
        print(f"   {phi:7.2f}   {eta_sphere(phi):.4f}    {3 / phi:.4f}")
    print()

    print("[6] Overall effectiveness Omega with the external film (k = 2e-3 1/s, k_c a_c from [1] and [4])")
    kbed = 2e-3
    for phi in (0.5, 2, 10):
        eta = eta_sphere(phi)
        Om = eta / (1 + eta * kbed / (kc * ac))
        print(f"   phi1 = {phi:5.1f}   eta = {eta:.4f}   k_c a_c = {kc * ac:.3e} 1/s   Omega = {Om:.4e}")


if __name__ == "__main__":
    main()
