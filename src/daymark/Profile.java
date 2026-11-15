package daymark;
import java.util.*;
/** Equal-day descriptive profiles of unitless within-session shares. */
public final class Profile {
  private Profile() {}
  public static final int BINS=13;
  public record Summary(double[] mean,double[] min,double[] max,double[] median) {}
  public static double[] shares(double[] values) {
    if(values.length!=BINS) throw new IllegalArgumentException("13 bins required");
    double scale=0;
    for(double x:values){if(!Double.isFinite(x)||x<0)throw new IllegalArgumentException("invalid value");scale=Math.max(scale,x);}
    if(scale==0)throw new IllegalArgumentException("zero session total");
    double sum=0;for(double x:values)sum+=x/scale;
    double[] out=new double[BINS];for(int i=0;i<BINS;i++)out[i]=(values[i]/scale)/sum;
    return out;
  }
  public static Summary summarize(List<double[]> rows) {
    if(rows.isEmpty())throw new IllegalArgumentException("empty sample");
    double[] mean=new double[BINS],min=new double[BINS],max=new double[BINS],median=new double[BINS];
    Arrays.fill(min,Double.POSITIVE_INFINITY);
    for(double[] row:rows){validateShares(row);for(int b=0;b<BINS;b++){double x=row[b]*BINS;mean[b]+=x/rows.size();min[b]=Math.min(min[b],x);max[b]=Math.max(max[b],x);}}
    for(int b=0;b<BINS;b++){double[] col=new double[rows.size()];for(int d=0;d<col.length;d++)col[d]=rows.get(d)[b]*BINS;Arrays.sort(col);median[b]=(col[(col.length-1)/2]+col[col.length/2])/2;}
    return new Summary(mean,min,max,median);
  }
  public static void validateShares(double[] row){
    if(row.length!=BINS)throw new IllegalArgumentException("13 bins required");double s=0;
    for(double x:row){if(!Double.isFinite(x)||x<0||x>1)throw new IllegalArgumentException("invalid share");s+=x;}
    if(Math.abs(s-1)>1e-9)throw new IllegalArgumentException("shares must sum to one");
  }
}
