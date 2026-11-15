package daymark;
import java.nio.file.*;
import java.time.*;
import java.time.format.*;
import java.util.*;
import java.io.*;
/** Offline only. Never distribute input OHLCV. Emits normalized derived results. */
public final class Aggregate {
  private Aggregate(){}
  private static final DateTimeFormatter STAMP=DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss").withResolverStyle(ResolverStyle.STRICT);
  public record Bar(LocalDateTime time,double open,double high,double low,double close,double volume){}
  public record Day(LocalDate date,double[] variance,double[] volume){}
  public record Result(List<Day> days,int outside,int incomplete){}
  public static Result read(Path path)throws IOException {
    Map<LocalDate,TreeMap<Integer,Bar>> sessions=new TreeMap<>();Set<LocalDateTime> seen=new HashSet<>();int outside=0;
    for(String line:Files.readAllLines(path)){
      if(line.isBlank())continue;String[] f=line.split(",",-1);if(f.length!=6)throw new IllegalArgumentException("six columns required");
      LocalDateTime t=LocalDateTime.parse(f[0],STAMP);if(t.getSecond()!=0||!seen.add(t))throw new IllegalArgumentException("duplicate or non-minute timestamp");
      double[] v=new double[5];for(int i=0;i<5;i++){v[i]=Double.parseDouble(f[i+1]);if(!Double.isFinite(v[i])||v[i]<0||(i<4&&v[i]==0))throw new IllegalArgumentException("invalid bar value");}
      if(v[2]>Math.min(v[0],v[3])||v[1]<Math.max(v[0],v[3])||v[1]<v[2])throw new IllegalArgumentException("OHLC inconsistency");
      int minute=t.getHour()*60+t.getMinute()-570;
      if(t.getDayOfWeek().getValue()>5||minute<0||minute>=390){outside++;continue;}
      sessions.computeIfAbsent(t.toLocalDate(),k->new TreeMap<>()).put(minute,new Bar(t,v[0],v[1],v[2],v[3],v[4]));
    }
    List<Day> days=new ArrayList<>();int incomplete=0;
    for(var e:sessions.entrySet()){
      var bars=e.getValue();if(bars.size()!=390){incomplete++;continue;}
      double[] variation=new double[13],volume=new double[13];double previous=bars.get(0).open();
      for(int k=0;k<78;k++){
        double close=bars.get(k*5+4).close();double r=Math.log(close)-Math.log(previous);variation[k/6]+=r*r;previous=close;
      }
      for(int i=0;i<390;i++)volume[i/30]+=bars.get(i).volume();
      try{days.add(new Day(e.getKey(),Profile.shares(variation),Profile.shares(volume)));}catch(IllegalArgumentException ex){incomplete++;}
    }
    return new Result(List.copyOf(days),outside,incomplete);
  }
  public static void main(String[] args)throws Exception {
    if(args.length!=2||!args[0].matches("SPY|AAPL"))throw new IllegalArgumentException("Aggregate SPY|AAPL private-input.csv");
    Result r=read(Path.of(args[1]));if(r.days().isEmpty())throw new IllegalArgumentException("no complete sessions");
    System.out.println("asset,date,bin,variance_share,volume_share");
    for(Day d:r.days())for(int b=0;b<13;b++)System.out.printf(Locale.ROOT,"%s,%s,%d,%.16g,%.16g%n",args[0],d.date(),b,d.variance()[b],d.volume()[b]);
    System.err.printf("%s: %d complete sessions; %d non-core bars; %d incomplete/zero-total sessions excluded%n",args[0],r.days().size(),r.outside(),r.incomplete());
  }
}
