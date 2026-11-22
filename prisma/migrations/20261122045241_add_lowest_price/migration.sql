-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "lowestInputPrice" DOUBLE PRECISION,
ADD COLUMN     "lowestOutputPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Model_lowestInputPrice_idx" ON "Model"("lowestInputPrice");
