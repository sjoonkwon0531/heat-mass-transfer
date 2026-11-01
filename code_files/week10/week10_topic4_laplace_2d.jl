# Week 10 - Topic 4: Two-Dimensional Steady Diffusion (Laplace Equation)
# Lecture (Part 2):
#   * rectangle 0<x<W, 0<y<H: c = 0 on x=0, x=W, y=0; c = c0 on y=H
#       c/c0 = sum_{n odd} (4/(n pi)) sin(n pi x/W) sinh(n pi y/W)/sinh(n pi H/W)
#   * TEOS stagnant gas between two wafers (LPCVD furnace): cylindrical (r, z)
#       (1/r) d/dr(r dc/dr) + d^2c/dz^2 = 0
#       c = c_A0 at r = R (open edge), c = 0 at z = 0 (fast surface reaction on the wafer),
#       dc/dr = 0 at r = 0, dc/dz = 0 at z = L/2 (mid-plane symmetry)
#     deposition flux on the wafer N(r) = D dc/dz|_{z=0}: the edge receives more than the center.
#   * extension: finite surface rate D dc/dz = ks c at the wafer, Da = ks L/D.
#     For a thin gap (L << R) the gap-averaged balance gives a Bessel problem:
#       c = c_A0 I0(m r)/I0(m R),  m^2 = 2 ks/(D L),  Thiele modulus Phi = m R
#     centre/edge deposition ratio = 1/I0(Phi): uniform wafers need Phi < ~0.5
#     (reaction-limited LPCVD), which is why TEOS furnaces can stack wafers closely.
using Printf

function rect_series(x, y; W = 1.0, H = 1.0, nterms = 101)
    s = 0.0
    for n in 1:2:nterms
        a = n * pi / W
        s += 4 / (n * pi) * sin(a * x) * exp(a * (y - H)) * (1 - exp(-2a * y)) / (1 - exp(-2a * H))
    end
    return s
end

function rect_sor(N = 40; omega = 1.85, tol = 1e-9)
    c = zeros(N + 1, N + 1); c[N+1, 2:N] .= 1.0          # c[j, i], j = y index
    for it in 1:20000
        err = 0.0
        for j in 2:N, i in 2:N
            d = omega * (0.25 * (c[j, i-1] + c[j, i+1] + c[j-1, i] + c[j+1, i]) - c[j, i])
            c[j, i] += d; err = max(err, abs(d))
        end
        err < tol && return c, it
    end
    return c, 20000
end

function I0(x)
    s, term, k = 1.0, 1.0, 1
    while true
        term *= (x / (2k))^2; s += term
        term < 1e-16 * s && return s
        k += 1
    end
end
thin_gap(r, R, Da, L) = (m = sqrt(2Da) / L; I0(m * r) / I0(m * R))

function wafer_sor(Da; R = 1.0, L = 0.1, Nr = 80, Nz = 10, omega = 1.9, tol = 1e-10)
    dr, dz = R / Nr, (L / 2) / Nz
    ar, az, beta = 1 / dr^2, 1 / dz^2, 2dz * Da / L
    c = zeros(Nz + 1, Nr + 1); c[:, Nr+1] .= 1.0         # row 1 = wafer (z = 0)
    for it in 1:200000
        err = 0.0
        for j in 2:Nz+1, i in 1:Nr
            up = j < Nz + 1 ? c[j+1, i] : c[j-1, i]; dn = c[j-1, i]
            if i == 1
                nw = (4ar * c[j, 2] + az * (up + dn)) / (4ar + 2az)
            else
                r = (i - 1) * dr; w = (1 - dr / (2r)) * ar; e = (1 + dr / (2r)) * ar
                nw = (w * c[j, i-1] + e * c[j, i+1] + az * (up + dn)) / (2ar + 2az)
            end
            d = omega * (nw - c[j, i]); c[j, i] += d; err = max(err, abs(d))
        end
        for i in 1:Nr
            nw = (4c[2, i] - c[3, i]) / (3 + beta); err = max(err, abs(nw - c[1, i])); c[1, i] = nw
        end
        err < tol && return c, it
    end
    return c, 200000
end

println("Rectangle W = H = 1, c/c0 at (x, y):")
cs, its = rect_sor()
for (x, y) in ((0.5, 0.5), (0.25, 0.75), (0.5, 0.9), (0.1, 0.5))
    @printf("  (%.2f,%.2f)  series = %.5f   SOR(40x40) = %.5f\n", x, y, rect_series(x, y), cs[round(Int, y * 40)+1, round(Int, x * 40)+1])
end
@printf("  SOR iterations: %d    centre value exact = 0.25 by superposition\n", its)
@printf("  Gibbs: partial sums at (0.02, 1.0): [%.4f, %.4f, %.4f]\n", (rect_series(0.02, 1.0; nterms = n) for n in (5, 21, 101))...)
println("\nTEOS wafer gap: R = 1, gap L = 0.1, Robin BC with Da = ks L/D")
println("  Thiele modulus Phi = R sqrt(2 Da)/L ; centre/edge deposition = 1/I0(Phi)")
println("  Da        Phi     FDM centre/edge   thin-gap 1/I0(Phi)   SOR its")
for Da in (1e-4, 1e-3, 1e-2, 5e-2)
    c, k = wafer_sor(Da)
    @printf("  %7.1e  %6.3f   %.4f            %.4f             %d\n", Da, sqrt(2Da) / 0.1, c[1, 1], thin_gap(0, 1, Da, 0.1), k)
end
println("  radial profile at Da = 1e-2 (Phi = 1.414):")
c, _ = wafer_sor(1e-2)
for f in (0.0, 0.25, 0.5, 0.75, 1.0)
    @printf("    r/R = %4.2f   FDM c_wafer = %.4f   thin-gap = %.4f\n", f, c[1, round(Int, f * 80)+1], thin_gap(f, 1, 1e-2, 0.1))
end
