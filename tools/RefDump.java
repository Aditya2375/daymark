import daymark.Profile;import java.util.*;import java.nio.file.*;
public class RefDump{
 public static void main(String[]args)throws Exception{
  Map<String,List<double[]>> groups=new TreeMap<>();for(String line:Files.readAllLines(Path.of("web/data/shares.csv")).subList(1,261)){String[]f=line.split(",");for(int m=0;m<2;m++){String key=f[0]+":"+m+":"+f[1];groups.computeIfAbsent(key,k->new ArrayList<>());if(groups.get(key).isEmpty())groups.get(key).add(new double[13]);groups.get(key).get(0)[Integer.parseInt(f[2])]=Double.parseDouble(f[3+m]);}}
  for(String asset:List.of("SPY","AAPL"))for(int m=0;m<2;m++){List<double[]>rows=new ArrayList<>();for(var e:groups.entrySet())if(e.getKey().startsWith(asset+":"+m+":"))rows.add(e.getValue().get(0));var s=Profile.summarize(rows);for(var e:Map.of("mean",s.mean(),"min",s.min(),"max",s.max(),"median",s.median()).entrySet())for(int b=0;b<13;b++)System.out.println(asset+","+m+","+e.getKey()+","+b+","+e.getValue()[b]);}
 }
}
