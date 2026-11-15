package daymark;
import java.util.*;import java.nio.file.*;import java.time.*;import java.io.*;
public class TestRunner{
 static int n=0;static void check(boolean ok,String name){if(!ok)throw new AssertionError(name);n++;System.out.println("ok - "+name);}static void near(double x,double y,String name){check(Math.abs(x-y)<1e-10,name);}static void bad(Runnable r,String name){boolean threw=false;try{r.run();}catch(IllegalArgumentException e){threw=true;}check(threw,name);}static double[] flat(){double[]r=new double[13];Arrays.fill(r,1);return r;}
 static String bars(String date,double base,int count){StringBuilder b=new StringBuilder();double previous=base;for(int i=0;i<count;i++){double close=base*Math.exp((i+1)*.0001);b.append(String.format(Locale.ROOT,"%s %02d:%02d:00,%.12f,%.12f,%.12f,%.12f,100%n",date,(570+i)/60,(570+i)%60,previous,close,previous,close));previous=close;}return b.toString();}
 static Aggregate.Result read(String raw)throws Exception{Path p=Files.createTempFile("daymark-test-",".csv");try{Files.writeString(p,raw);return Aggregate.read(p);}finally{Files.delete(p);}}
 static boolean rejects(String raw){try{read(raw);return false;}catch(Exception e){return true;}}
 public static void main(String[]args)throws Exception{
  var equal=Profile.shares(flat());near(equal[0],1.0/13,"flat shares");near(Arrays.stream(equal).sum(),1,"share sum");
  double[] big=flat();Arrays.fill(big,Double.MAX_VALUE);near(Profile.shares(big)[0],equal[0],"huge total cannot overflow");
  Arrays.fill(big,Double.MIN_VALUE);near(Profile.shares(big)[0],equal[0],"subnormal scale");
  double[] one=new double[13];one[7]=10;near(Profile.shares(one)[7],1,"single nonzero bin");near(Profile.shares(one)[0],0,"zero bin allowed");
  bad(()->Profile.shares(new double[13]),"zero session rejected");bad(()->Profile.shares(new double[12]),"wrong bin count rejected");
  double[] neg=flat();neg[0]=-1;bad(()->Profile.shares(neg),"negative rejected");neg[0]=Double.NaN;bad(()->Profile.shares(neg),"NaN rejected");neg[0]=Double.POSITIVE_INFINITY;bad(()->Profile.shares(neg),"infinite rejected");
  var summary=Profile.summarize(List.of(equal,equal));near(summary.mean()[0],1,"flat index");near(summary.min()[0],1,"flat minimum");near(summary.max()[0],1,"flat maximum");near(summary.median()[0],1,"even median");
  double[] concentrated=Profile.shares(one);var two=Profile.summarize(List.of(equal,concentrated));near(two.mean()[7],7,"equal-day averaging");near(two.median()[7],7,"two-day median");near(two.min()[7],1,"daily minimum");near(two.max()[7],13,"daily maximum");
  near(Profile.summarize(List.of(equal,concentrated,concentrated)).median()[7],13,"odd median");bad(()->Profile.summarize(List.of()),"empty sample rejected");bad(()->Profile.validateShares(flat()),"invalid share total rejected");
  var r=read(bars("2026-11-02",100,390));check(r.days().size()==1,"complete session accepted");for(double x:r.days().get(0).variance())near(x,1.0/13,"constant five-minute returns");near(r.days().get(0).volume()[12],1.0/13,"volume fraction");
  var twice=read(bars("2026-11-02",100,390)+bars("2026-11-03",10000,390));check(twice.days().size()==2,"two sessions accepted");near(twice.days().get(1).variance()[0],1.0/13,"overnight jump excluded");
  var missing=read(bars("2026-11-02",100,389));check(missing.days().isEmpty()&&missing.incomplete()==1,"missing minute drops whole day");
  var early=read(bars("2026-11-27",100,210));check(early.days().isEmpty()&&early.incomplete()==1,"half-day excluded");
  var extra=read(bars("2026-11-02",100,390)+"2026-11-02 16:00:00,100,100,100,100,999999999\n");check(extra.outside()==1,"16:00 bar outside core window");near(extra.days().get(0).volume()[12],1.0/13,"outside volume excluded");
  check(read(bars("2026-11-07",100,390)).days().isEmpty(),"weekend excluded");
  check(rejects(bars("2026-11-02",100,390)+bars("2026-11-02",100,1)),"duplicates rejected");
  check(rejects("2026-11-02 09:30:00,100,90,95,100,5\n"),"inconsistent OHLC rejected");check(rejects("2026-11-02 09:30:00,100,101,99,100,-1\n"),"negative volume rejected");check(rejects("2026-11-02 09:30:00,NaN,101,99,100,1\n"),"nonfinite raw rejected");check(rejects("2026-11-31 09:30:00,100,100,100,100,1\n"),"invalid date rejected");check(rejects("2026-11-02 09:30:10,100,100,100,100,1\n"),"non-minute stamp rejected");
  String constant=bars("2026-11-02",100,390).replaceAll(",[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+,100",",100,100,100,100,100");check(read(constant).days().isEmpty(),"zero variation session excluded");
  System.out.println(n+" Java checks passed");
 }
}
