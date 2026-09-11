# Week 3 - Topic 4: Numerical Solution of the 2D Laplace Equation by FDM
# 5-point stencil: T[i+1,j] + T[i-1,j] + T[i,j+1] + T[i,j-1] - 4*T[i,j] = 0
# Solved iteratively (Gauss-Seidel / Liebmann method) until max|T_new - T_old| < tol.
# Part 1 validates the classic 4x4 heated-plate example from the lecture
# (top=100, left=75, right=50, bottom=0) -> 3x3 unknowns solvable by a linear system.
# Part 2 solves the unit square with top T=1, other sides T=0 on a fine grid.

import numpy as np

def gauss_seidel_laplace(T, fixed_mask, tol=1e-6, max_iter=100000):
    """In-place Gauss-Seidel on interior (non-fixed) nodes. Returns iterations used."""
    ny, nx = T.shape
    for it in range(1, max_iter + 1):
        err = 0.0
        for i in range(1, ny - 1):
            for j in range(1, nx - 1):
                if fixed_mask[i, j]:
                    continue
                new = 0.25 * (T[i + 1, j] + T[i - 1, j] + T[i, j + 1] + T[i, j - 1])
                err = max(err, abs(new - T[i, j]))
                T[i, j] = new
        if err < tol:
            return it
    return max_iter

if __name__ == "__main__":
    # --- Part 1: 4x4 plate (3x3 interior unknowns), direct linear-system solve ---
    # Grid indices (i=row from bottom j... here use (col i=1..3, row j=1..3) as in lecture)
    # Boundary: T(top)=100, T(left)=75, T(right)=50, T(bottom)=0
    A = np.zeros((9, 9))
    b = np.zeros(9)
    top, left, right, bottom = 100.0, 75.0, 50.0, 0.0
    def idx(i, j):  # i: x-index 1..3, j: y-index 1..3 -> flattened 0..8
        return (j - 1) * 3 + (i - 1)
    for j in range(1, 4):
        for i in range(1, 4):
            r = idx(i, j)
            A[r, r] = 4.0
            for (ii, jj) in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                if ii == 0:
                    b[r] += left
                elif ii == 4:
                    b[r] += right
                elif jj == 0:
                    b[r] += bottom
                elif jj == 4:
                    b[r] += top
                else:
                    A[r, idx(ii, jj)] = -1.0
    Tsol = np.linalg.solve(A, b)
    print("Part 1: 3x3 interior nodes of the heated plate (linear system solve)")
    for j in (3, 2, 1):
        row = "  ".join(f"T[{i},{j}]={Tsol[idx(i, j)]:7.3f}" for i in range(1, 4))
        print("  " + row)

    # Cross-check with Gauss-Seidel on the same 5x5 grid
    T = np.zeros((5, 5))
    T[4, :] = top; T[0, :] = bottom; T[:, 0] = left; T[:, 4] = right
    fixed = np.zeros_like(T, dtype=bool)
    iters = gauss_seidel_laplace(T, fixed, tol=1e-10)
    gs = np.array([T[j, i] for j in range(1, 4) for i in range(1, 4)])
    direct = np.array([Tsol[idx(i, j)] for j in range(1, 4) for i in range(1, 4)])
    print(f"  Gauss-Seidel converged in {iters} iterations; "
          f"max |GS - direct| = {np.abs(gs - direct).max():.2e}")

    # --- Part 2: fine-grid unit square, top side hot (matches lecture MATLAB demo) ---
    n = 40
    T = np.zeros((n, n))
    T[-1, :] = 1.0          # top row = 1 (normalized)
    fixed = np.zeros_like(T, dtype=bool)
    iters = gauss_seidel_laplace(T, fixed, tol=1e-6)
    print(f"\nPart 2: {n}x{n} grid, top side T=1, others 0")
    print(f"  converged in {iters} iterations")
    print(f"  T at center       = {T[n // 2, n // 2]:.6f}")
    print(f"  T at (0.5, 0.75)  = {T[3 * n // 4, n // 2]:.6f}")
